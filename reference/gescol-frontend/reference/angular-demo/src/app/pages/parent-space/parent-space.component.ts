import { Component } from '@angular/core';
import { CobimagBase } from '../../shared/cobimag-base';
import { formatXAF, KIDS } from '../../data/school-data';

@Component({
  selector: 'app-parent-space',
  standalone: true,
  templateUrl: './parent-space.component.html',
})
export class ParentSpaceComponent extends CobimagBase {
  childSelectorStyle: 'Cartes' | 'Onglets' = 'Cartes';
  showNewEnrollmentButton = true;
  paymentAlertEnabled = true;

  parentName = 'Mme Aïcha Fomba';
  private kids = KIDS;
  selectedChildId = KIDS[0].id;
  selectChild = (id: string) => { this.selectedChildId = id; };

  private get raw() { return this.kids.find(c => c.id === this.selectedChildId) || this.kids[0]; }

  private decorate(c: any) {
    const isSel = c.id === this.raw.id;
    const isFr = c.track === 'fr';
    return {
      ...c,
      select: () => this.selectChild(c.id),
      cardBg: isSel ? '#EAF5EE' : '#FFFFFF',
      cardBorder: isSel ? '1.5px solid #008B47' : '1px solid #E7E7E5',
      tabBorder: isSel ? '#008B47' : 'transparent',
      tabColor: isSel ? '#008B47' : '#5F6161',
      trackBg: isFr ? '#008B47' : '#FFFFFF',
      trackColor: isFr ? '#FFFFFF' : '#008B47',
      trackBorder: isFr ? 'none' : '1.5px solid #008B47',
    };
  }

  get children() { return this.kids.map(c => this.decorate(c)); }
  get selectedChild() { return this.decorate(this.raw); }
  get showMultipleChildren() { return this.kids.length > 1; }
  get childSelectorIsCards() { return this.childSelectorStyle === 'Cartes'; }
  get childSelectorIsTabs() { return this.childSelectorStyle === 'Onglets'; }
  get showPaymentAlert() { return this.paymentAlertEnabled && this.raw.scolarite.solde > 0; }
  get totalFmt() { return formatXAF(this.raw.scolarite.total); }
  get verseFmt() { return formatXAF(this.raw.scolarite.verse); }
  get soldeFmt() { return formatXAF(this.raw.scolarite.solde); }
  get soldeColor() { return this.raw.scolarite.solde > 0 ? '#C0392B' : '#008B47'; }
  get soldeLabel() { return this.raw.scolarite.solde > 0 ? 'Solde restant' : 'Scolarité à jour'; }
  private get disciplineOk() { return this.raw.discipline.status === 'ras'; }
  get disciplineBg() { return this.disciplineOk ? '#EAF5EE' : '#FDECE1'; }
  get disciplineColor() { return this.disciplineOk ? '#008B47' : '#E8722C'; }
  get disciplineStatusLabel() { return this.disciplineOk ? 'RAS — rien à signaler' : 'Incidents mineurs signalés'; }
  get historique() {
    return this.raw.historique.map((h: any) => ({
      ...h, montantFmt: formatXAF(h.montant), resteFmt: formatXAF(h.resteApres),
    }));
  }
}
