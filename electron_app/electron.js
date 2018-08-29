const electron = require('electron');
const autoUpdater = require('electron-updater').autoUpdater;
const path = require('path');
const app = electron.app;
const notifier = require('electron-notifications');
const isDev = require('electron-is-dev');
const getPort = require('get-port');
const fs = require('fs');
const startProcessEngine = require('@process-engine/skeleton-electron');
const {dialog} = require('electron');

// If BPMN-Studio was opened by double-clicking a .bpmn file, then the
// following code tells the frontend the name and content of that file;
// this 'get_opened_file' request is emmitted in src/main.ts.
let filePath;

const Main = {};

Main._window = null;

Main.execute = function () {

  // All custom scheme notifications on Windows and Linux will try to create a new instance of the application
  const existingInstance = app.makeSingleInstance((argv, workingDirectory) => {});

  if (existingInstance) {

    // Quit the new instance if required
    app.quit();

  } else {

    // If this is the first instance then start the application
    Main._startInternalProcessEngine();

    Main._initializeApplication();
  }
}

Main._initializeApplication = function () {

  app.on('ready', Main._createMainWindow);

  app.on('activate', () => {
    if (Main._window === null) {
      Main._createMainWindow();
    }
  });

  initializeDeepLinking();

  const platformIsNotWindows = process.platform !== 'win32';
  // The AutoUpdater gets not initialized on windows, because it is broken currently
  // See https://github.com/process-engine/bpmn-studio/issues/715
  if (platformIsNotWindows) {
    initializeAutoUpdater();
  } else {
    electron.ipcMain.on('add_autoupdater_listener', (event) => {
      event.sender.send('autoupdater_windows_notification');
    });
  }

  initializeFileOpenFeature();

  function initializeDeepLinking() {

    app.setAsDefaultProtocolClient('bpmn-studio');

    // open-url is called every time someone tries to open a link like:
    // bpmn-studio://myActualUrl
    app.on('open-url', (event, url) => {
      console.log('open-url called', url);
      event.preventDefault();

      // This bug seems to be causing the oidc-client to use a hard redirect
      // instead of using an iFrame:
      // https://github.com/electron/electron/issues/9581

      Main._bringExistingInstanceToForeground();

      // ----------------------------------------------------------------------
      // Hacky Implicit Flow in Electron ©2018 5Minds
      // ----------------------------------------------------------------------

      // The Login

      // 1. trigger sign in on oidc-client
      // 2. get redirected to IdentityServer login page
      // 3. login on that page
      // 4. get redirected to the custom protocol
      //    (bpmn-studio://signin-oidc#<<token_data_goes_here>>)
      // 5. electron main process navigates the browser window from Identity
      //    Server login page to Aurelia application
      // 6. electron main process sends the extracted token data from the signin
      //    response to the Aurelia application
      // 7. oidc client fetches the data via push state
      // 8. login state is propagated through application

      // ----------------------------------------------------------------------

      // The Logout

      // 1. send http request to IdentityServer for logout
      //    (/connect/endsession)
      // 2. if success, open Identity Server success page as a separate window
      // 3. if finish link in the new window is clicked, get redirected to
      //    custom protocol (bpmn-studio://signout-oidc)
      // 4. electron main process sends the signout to the Aurelia application
      // 5. state is cleared and logout state is propagated through application

      // ----------------------------------------------------------------------

      if (url.startsWith('bpmn-studio://signin-oidc')) {

        // If this is the signin response from the implicit OAuth flow,
        // we need to navigate to the start page to activate the Aurelia
        // application again. Due to the bug referenced above, the login page of
        // the IdentityServer is opened in the same window, so that the Aurelia
        // application closes down.

        Main._window.loadURL(`file://${__dirname}/../index.html`);

        Main._window.loadURL('/');

        // Once the Aurelia application is ready to accept deep linking
        // requests, we can send the url with the id_token and access_token
        // contained in the query params of the url.
        electron.ipcMain.once('deep-linking-ready', (event) => {
          Main._window.webContents.send('deep-linking-request', url);
        });
      } else {

        // Because the logout portion of the implicit workflow is handled
        // manually, the Identity Server dialog can be opened in a separate
        // window, so that the Aurelia application keeps running.
        // Therefore we can directly send the url for the deep linking request.
        Main._window.webContents.send('deep-linking-request', url);
      }

    });
  }

  function initializeAutoUpdater() {

    const prereleaseRegex = /\d+\.\d+\.\d+-pre-b\d+/;

    const installButtonText = 'Install';
    const dismissButtonText = 'Dismiss';

    autoUpdater.checkForUpdates();

    const currentVersion = electron.app.getVersion();
    const currentVersionIsPrerelease = prereleaseRegex.test(currentVersion);

    autoUpdater.allowPrerelease = currentVersionIsPrerelease;

    console.log(`CurrentVersion: ${currentVersion}, CurrentVersionIsPrerelease: ${currentVersionIsPrerelease}`);

    autoUpdater.addListener('error', (error) => {
      const notification = notifier.notify('Update error', {
        message: 'Update failed',
        buttons: [dismissButtonText],
      });
      notification.on('buttonClicked', (text, buttonIndex, options) => {
        notification.close();
      });
    });

    autoUpdater.addListener('update-available', (info) => {
      notifier.notify('Update available', {
        message: 'Started downloading',
        buttons: [dismissButtonText],
      });
    });

    autoUpdater.addListener('update-downloaded', (info) => {
      const notification = notifier.notify('Update ready', {
        message: 'Update ready for installation',
        duration: '60000',
        buttons: [installButtonText, dismissButtonText],
      });

      notification.on('buttonClicked', (text, buttonIndex, options) => {
        const installButtonClicked = text === installButtonText;
        if (installButtonClicked) {
          autoUpdater.quitAndInstall();
        } else {
          notification.close();
        }
      })
    });

  }

  function initializeFileOpenFeature() {
    app.on('window-all-closed', () => {
      app.quit();
      filePath = undefined;
    });

    app.on('will-finish-launching', () => {
      // for windows
      if (process.platform == 'win32' && process.argv.length >= 2) {
        filePath = process.argv[1];
      }

      // for non-windows
      app.on('open-file', (event, path) => {
        filePath = path;
      });
    });

    /**
     * Wait for the "waiting"-event signalling the app has started and the
     * component is ready to handle events.
     *
     * Register an "open-file"-listener to get the path to file which has been
     * clicked on.
     *
     * "open-file" gets fired when someone double clicks a .bpmn file.
     */
    electron.ipcMain.on('waiting-for-double-file-click', (mainEvent) => {
      app.on('open-file', (event, path) => {
        mainEvent.sender.send('double-click-on-file', path);
      })
    });

    electron.ipcMain.on('get_opened_file', (event) => {
      if (filePath === undefined) {
        event.returnValue = {};
        return;
      }

      event.returnValue = {
        path: filePath,
        content: fs.readFileSync(filePath, 'utf8'),
      }
      filePath = undefined;
      app.focus();

    });

  }

}

Main._createMainWindow = function () {

  console.log('create window called');

  setElectronMenubar();

  Main._window = new electron.BrowserWindow({
    width: 1300,
    height: 800,
    title: "BPMN-Studio",
    minWidth: 1300,
    minHeight: 800,
    icon: path.join(__dirname, '../build/icon.png'), // only for windows and linux
    titleBarStyle: 'hiddenInset'
  });

  Main._window.loadURL(`file://${__dirname}/../index.html`);
  // We need to navigate to "/" because something in the push state seems to be
  // broken if we carry a file system link as the last item of the browser
  // history.
  Main._window.loadURL('/');

  Main._window.on('closed', () => {
    Main._window = null;
  });


  const platformIsWindows = process.platform === 'win32';

  if (platformIsWindows) {
    Main._window.webContents.session.on('will-download', (event, downloadItem) => {
      const defaultFilename = downloadItem.getFilename();

      const fileTypeIndex = defaultFilename.lastIndexOf('.') + 1;
      const fileExtension = defaultFilename.substring(fileTypeIndex);

      const fileExtensionIsBPMN = fileExtension === 'bpmn';
      const fileType = fileExtensionIsBPMN ? 'BPMN (.bpmn)' : `Image (.${fileExtension})`;

      const filename = dialog.showSaveDialog({
        defaultPath: defaultFilename,
        filters: [
          {
            name: fileType,
            extensions: [fileExtension]
          },
          {
            name: 'All Files',
            extensions: ['*']
          }
        ]
      });

      const downloadCanceled = filename === undefined;
      if (downloadCanceled) {
        downloadItem.cancel();

        return;
      }

      downloadItem.setSavePath(filename);
    });
  }

  function setElectronMenubar() {

    let template = [{
      label: "BPMN-Studio",
      submenu: [{
          label: "About BPMN-Studio",
          selector: "orderFrontStandardAboutPanel:"
        },
        {
          type: "separator"
        },
        {
          label: "Quit",
          role: "quit"
        }
      ]
    }, {
      label: "Edit",
      submenu: [{
          label: "Undo",
          accelerator: "CmdOrCtrl+Z",
          selector: "undo:"
        },
        {
          label: "Redo",
          accelerator: "CmdOrCtrl+Shift+Z",
          selector: "redo:"
        },
        {
          type: "separator"
        },
        {
          label: "Cut",
          accelerator: "CmdOrCtrl+X",
          selector: "cut:"
        },
        {
          label: "Copy",
          accelerator: "CmdOrCtrl+C",
          selector: "copy:"
        },
        {
          label: "Paste",
          accelerator: "CmdOrCtrl+V",
          selector: "paste:"
        },
        {
          label: "Select All",
          accelerator: "CmdOrCtrl+A",
          selector: "selectAll:"
        }
      ]
    }, {
      label: "Window",
      submenu: [{
          role: "minimize"
        },
        {
          role: "close"
        },
        {
          type: "separator"
        },
        {
          role: "reload"
        },
        {
          role: "toggledevtools"
        }
      ]
    }];

    electron.Menu.setApplicationMenu(electron.Menu.buildFromTemplate(template));
  }
}

Main._startInternalProcessEngine = function () {

  const devUserDataFolderPath = path.join(__dirname, '..', 'userData');
  const prodUserDataFolderPath = app.getPath('userData');

  const userDataFolderPath = isDev ? devUserDataFolderPath : prodUserDataFolderPath;

  if (!isDev) {
    process.env.CONFIG_PATH = path.join(__dirname, '..', '..', '..', 'config');
  }

  const getPortConfig = {
    port: 8000,
    host: '0.0.0.0'
  };

  return getPort(getPortConfig)
    .then((port) => {

      console.log(`Internal ProcessEngine starting on port ${port}.`);

      process.env.http__http_extension__server__port = port;

      const processEngineDatabaseFolderName = 'process_engine_databases';

      process.env.process_engine__process_model_repository__storage = path.join(userDataFolderPath, processEngineDatabaseFolderName, 'process_model.sqlite');
      process.env.process_engine__flow_node_instance_repository__storage = path.join(userDataFolderPath, processEngineDatabaseFolderName, 'flow_node_instance.sqlite');
      process.env.process_engine__timer_repository__storage = path.join(userDataFolderPath, processEngineDatabaseFolderName, 'timer.sqlite');

      let internalProcessEngineStatus = undefined;
      let internalProcessEngineStartupError = undefined;
      const processEngineStatusListeners = [];

      function _sendInternalProcessEngineStatus(sender) {
        let serializedStartupError;
        const processEngineStartSuccessful = (internalProcessEngineStartupError !== undefined &&
          internalProcessEngineStartupError !== null);

        if (processEngineStartSuccessful) {
          serializedStartupError = JSON.stringify(
            internalProcessEngineStartupError,
            Object.getOwnPropertyNames(internalProcessEngineStartupError));

        } else {
          serializedStartupError = undefined;
        }

        sender.send(
          'internal_processengine_status',
          internalProcessEngineStatus,
          serializedStartupError);
      }

      function _publishProcessEngineStatus() {
        processEngineStatusListeners.forEach(_sendInternalProcessEngineStatus);
      }

      /* When someone wants to know to the internal processengine status, he
       * must first send a `add_internal_processengine_status_listener` message
       * to the event mechanism. We recieve this message here and add the sender
       * to our listeners array.
       *
       * As soon, as the processengine status is updated, we send the listeners a
       * notification about this change; this message contains the state and the
       * error text (if there was an error).
       *
       * If the processengine status is known by the time the listener registers,
       * we instantly respond to the listener with a notification message.
       *
       * This is quite a unusual pattern, the problem this approves solves is the
       * following: It's impossible to do interactions between threads in
       * electron like this:
       *
       *  'renderer process'              'main process'
       *          |                             |
       *          o   <<<- Send Message  -<<<   x
       *
       * -------------------------------------------------
       *
       * Instead our interaction now locks like this:
       *
       *  'renderer process'              'main process'
       *          |                             |
       *          x   >>>--  Subscribe  -->>>   o
       *          o   <<<- Send Message  -<<<   x
       *          |       (event occurs)        |
       *          o   <<<- Send Message  -<<<   x
       */
      electron.ipcMain.on('add_internal_processengine_status_listener', (event) => {
        if (!processEngineStatusListeners.includes(event.sender)) {
          processEngineStatusListeners.push(event.sender);
        }

        if (internalProcessEngineStatus !== undefined) {
          _sendInternalProcessEngineStatus(event.sender);
        }
      });

      // This tells the frontend the location at which the electron-skeleton
      // will be running; this 'get_host' request ist emitted in src/main.ts.
      electron.ipcMain.on('get_host', (event) => {
        event.returnValue = `localhost:${port}`;
      });

      // TODO: Check if the ProcessEngine instance is now run on the UI thread.
      // See issue https://github.com/process-engine/bpmn-studio/issues/312
      return startProcessEngine()
        .then((processengine) => {

          console.log('Internal ProcessEngine started successfully.');
          internalProcessEngineStatus = 'success';

          _publishProcessEngineStatus();

        }).catch((error) => {

          console.error('Failed to start internal ProcessEngine: ', error);

          electron.ipcMain.on('add_error_log_listener', (event) => {
            event.sender.send('error_log', error);
          });

          internalProcessEngineStatus = 'error';
          internalProcessEngineStartupError = error;

          _publishProcessEngineStatus();
        });
    });

}

Main._bringExistingInstanceToForeground = function () {

  if (Main._window) {

    if (Main._window.isMinimized()) {
      Main._window.restore();
    }

    Main._window.focus();
  }
}

// Run our main class
Main.execute();
