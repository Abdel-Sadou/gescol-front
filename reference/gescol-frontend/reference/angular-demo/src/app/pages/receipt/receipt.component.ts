import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CobimagBase } from '../../shared/cobimag-base';
import { buildQrCells } from '../../data/school-data';

@Component({
  selector: 'app-receipt',
  standalone: true,
  templateUrl: './receipt.component.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA], // <doc-page> est un web component
})
export class ReceiptComponent extends CobimagBase {
  qrCells = buildQrCells();
}
