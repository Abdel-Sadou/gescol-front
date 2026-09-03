import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ToastModule } from 'primeng/toast';

import { StudentFormPageComponent } from './features/student-form/student-form-page.component';

@Component({
  selector: 'cob-root',
  imports: [StudentFormPageComponent, ToastModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-toast position="bottom-right" />
    <cob-student-form-page />
  `,
})
export class AppComponent {}
