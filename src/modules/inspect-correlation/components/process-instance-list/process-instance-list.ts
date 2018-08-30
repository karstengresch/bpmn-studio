import {bindable, bindingMode} from 'aurelia-framework';

import {Correlation} from '@process-engine/management_api_contracts';

export class ProcessInstanceList {
  @bindable() public selectedCorrelation: Correlation;
  @bindable({defaultBindingMode: bindingMode.oneWay}) public processModelCorrelations: Array<Correlation>;

  public selectCorrelation(selectedCorrelation: Correlation): void {
    this.selectedCorrelation = selectedCorrelation;
  }
}
