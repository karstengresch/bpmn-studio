#!/usr/bin/env groovy

def cleanup_workspace() {
  cleanWs()
  dir("${env.WORKSPACE}@tmp") {
    deleteDir()
  }
  dir("${env.WORKSPACE}@script") {
    deleteDir()
  }
  dir("${env.WORKSPACE}@script@tmp") {
    deleteDir()
  }
}

pipeline {
  agent any
  tools {
    nodejs "node-lts"
  }
  environment {
    NPM_RC_FILE = 'developers5minds-token'
    NODE_JS_VERSION = 'node-lts'
  }

  stages {
    stage('prepare') {
      steps {
        script {
          raw_package_version = sh(script: 'node --print --eval "require(\'./package.json\').version"', returnStdout: true)
          package_version = raw_package_version.trim()
          echo("Package version is '${package_version}'")

          branch = env.BRANCH_NAME;
          branch_is_master = branch == 'master';
          branch_is_develop = branch == 'develop';

          if (branch_is_master) {
            full_electron_release_version_string = "${package_version}";
          } else {
            full_electron_release_version_string = "${package_version}-pre-b${env.BUILD_NUMBER}";
          }

          // When building a non master or develop branch the release will be a draft.
          release_will_be_draft = !branch_is_master && !branch_is_develop;

          echo("Branch is '${branch}'")
        }
        nodejs(configId: env.NPM_RC_FILE, nodeJSInstallationName: env.NODE_JS_VERSION) {
          sh('node --version')
          sh('npm install')
          sh('npm rebuild node-sass')
        }
      }
    }
    stage('lint') {
      steps {
        sh('node --version')
        sh('npm run lint')
      }
    }
    stage('build') {
      steps {
        sh('node --version')
        sh('npm run build')
        sh("npm version ${full_electron_release_version_string} --allow-same-version --force --no-git-tag-version")

        stash(includes: '@fortawesome/, bootstrap/, scripts/, package.json', name: 'post_build')
        stash(includes: 'node_modules/', name: 'post_build_node_modules')
      }
    }
    stage('end to end tests') {
      agent any
      steps {
        script {
          unstash('post_build')
          unstash('post_build_node_modules')

          def docker_e2e_image_name = "bpmn-studio_end-to-end"
          def docker_e2e_container_name = "${docker_e2e_image_name}_container-b${env.BUILD_NUMBER}-${env.GIT_COMMIT}"

          try {
            sh("docker build --file test/Dockerfile --tag ${docker_e2e_image_name} .")

            def docker_run_cmd = 'docker run'
            docker_run_cmd += ' --user 112:116' // Use the jenkins system user.
            docker_run_cmd += " --env HOME=${env.WORKSPACE}" // Override home folder.
            docker_run_cmd += " --workdir \"${env.WORKSPACE}\"" // Use workspace as workdir.
            docker_run_cmd += " --volume=\"${env.WORKSPACE}:${env.WORKSPACE}:Z\"" // Mount workspace into the container. Z flags fixes the permissions.
            docker_run_cmd += ' --rm' // Delete container after run.
            docker_run_cmd += " --name ${docker_e2e_container_name}" // Set the container name.
            docker_run_cmd += " ${docker_e2e_image_name}" // The image to run.

            sh("${docker_run_cmd} | tee e2e_test_results.txt")

          } finally {
            sh("docker rm ${docker_e2e_container_name} || true")
          }

          def parse_test_result_regex = /(\d+) specs, (\d+) failures/;

          def test_result_log = readFile "e2e_test_results.txt"
          def test_result_matcher = test_result_log =~ parse_test_result_regex

          def total_tests_run = test_result_matcher[0][1] as Integer;
          def tests_failed = test_result_matcher[0][2] as Integer;

          echo "${total_tests_run} Tests run. ${tests_failed} Tests failed."

          def some_tests_failed = tests_failed != 0;
          if (some_tests_failed) {
            error 'Some tests failed, build failed.';
          }
        }
      }
    }
    stage('build electron') {
      when {
        expression { branch_is_master || branch_is_develop }
      }
      parallel {
        stage('Build on Linux') {
          agent {
            label "linux"
          }
          steps {
            unstash('post_build')
            unstash('post_build_node_modules')

            sh('node --version')

            sh('npm run jenkins-electron-install-app-deps')
            sh('npm run jenkins-electron-rebuild-native')
            sh('npm run jenkins-electron-build-linux')
            stash(includes: 'dist/*.*', excludes: 'electron-builder-effective-config.yaml', name: 'linux_results')
          }
          post {
            always {
              cleanup_workspace()
            }
          }
        }
        stage('Build on MacOS') {
          agent {
            label "macos"
          }
          steps {
            unstash('post_build')
            unstash('post_build_node_modules')

            sh('node --version')
            // we copy the node_modules folder from the main slave
            // which runs linux. Some dependencies may not be installed
            // if they have a os restriction in their package.json
            sh('npm install')

            sh('npm run jenkins-electron-install-app-deps')
            sh('npm run jenkins-electron-rebuild-native')

            withCredentials([
              string(credentialsId: 'apple-mac-developer-certifikate', variable: 'CSC_LINK'),
            ]) {
              sh('npm run jenkins-electron-build-macos')
            }
            stash(includes: 'dist/*.*, dist/mac/*', excludes: 'electron-builder-effective-config.yaml', name: 'macos_results')
          }
          post {
            always {
              cleanup_workspace()
            }
          }
        }
        stage('Build on Windows') {
          agent {
            label "windows"
          }
          steps {
            unstash('post_build')
            bat('node --version')

            // we copy the node_modules folder from the main slave
            // which runs linux. Some dependencies may not be installed
            // if they have a os restriction in their package.json
            bat('npm install')

            bat('npm run jenkins-electron-rebuild-native')
            bat('npm run jenkins-electron-build-windows')

            stash(includes: 'dist/*.*', excludes: 'electron-builder-effective-config.yaml', name: 'windows_results')
          }
          post {
            always {
              cleanup_workspace()
            }
          }
        }
      }
    }
    stage('publish') {
      steps {
        script {
          def new_commit = env.GIT_PREVIOUS_COMMIT != env.GIT_COMMIT;

          if (branch_is_master) {

            def previous_build = currentBuild.getPreviousBuild();
            def previous_build_status = previous_build == null ? null : previous_build.result;

            def should_publish_to_npm = new_commit || previous_build_status == 'FAILURE';

            if (should_publish_to_npm) {
              script {
                // let the build fail if the version does not match normal semver
                def semver_matcher = package_version =~ /\d+\.\d+\.\d+/;
                def is_version_not_semver = semver_matcher.matches() == false;
                if (is_version_not_semver) {
                  error('Only non RC Versions are allowed in master')
                }
              }

              def raw_package_name = sh(script: 'node --print --eval "require(\'./package.json\').name"', returnStdout: true).trim();
              def current_published_version = sh(script: "npm show ${raw_package_name} version", returnStdout: true).trim();
              def version_has_changed = current_published_version != raw_package_version;

              if (version_has_changed) {
                nodejs(configId: env.NPM_RC_FILE, nodeJSInstallationName: env.NODE_JS_VERSION) {
                  sh('node --version')
                  sh('npm publish --ignore-scripts')
                }
              } else {
                println 'Skipping publish for this version. Version unchanged.'
              }
            } else {
              println 'Skipped publishing for this version. No new commits pushed and previous build did not fail.'
            }

          } else {
            // when not on master, publish a prerelease based on the package version, the
            // current git commit and the build number.
            // the published version gets tagged as the branch name.
            def first_seven_digits_of_git_hash = env.GIT_COMMIT.substring(0, 8);
            def publish_version = "${package_version}-${first_seven_digits_of_git_hash}-b${env.BUILD_NUMBER}";
            def publish_tag = branch.replace("/", "~");

            nodejs(configId: env.NPM_RC_FILE, nodeJSInstallationName: env.NODE_JS_VERSION) {
              sh('node --version')
              sh("npm version ${publish_version} --allow-same-version --force --no-git-tag-version ")
              sh("npm publish --tag ${publish_tag} --ignore-scripts")
            }
          }
        }
      }
    }
    stage('publish electron') {
      when {
        expression { branch_is_master || branch_is_develop }
      }
      steps {
        unstash('linux_results')
        unstash('macos_results')
        unstash('windows_results')
        nodejs(configId: env.NPM_RC_FILE, nodeJSInstallationName: env.NODE_JS_VERSION) {
          dir('.ci-tools') {
            sh('npm install')
          }
          withCredentials([
            string(credentialsId: 'process-engine-ci_token', variable: 'RELEASE_GH_TOKEN')
          ]) {
            script {
              sh("node .ci-tools/publish-github-release.js ${full_electron_release_version_string} ${full_electron_release_version_string} ${branch} ${release_will_be_draft} ${!branch_is_master}");
            }
          }
        }
      }
    }
    stage('cleanup') {
      steps {
        script {
          // this stage just exists, so the cleanup-work that happens in the post-script
          // will show up in its own stage in Blue Ocean
          sh(script: ':', returnStdout: true);
        }
      }
    }
  }
  post {
    always {
      script {
        cleanup_workspace();
      }
    }
  }
}
