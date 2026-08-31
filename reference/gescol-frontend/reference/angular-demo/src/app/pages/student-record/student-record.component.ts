import { Component } from '@angular/core';
import { CobimagBase } from '../../shared/cobimag-base';
import { formatXAF, STUDENTS } from '../../data/school-data';

@Component({
  selector: 'app-student-record',
  standalone: true,
  templateUrl: './student-record.component.html',
})
export class StudentRecordComponent extends CobimagBase {
  compactMode = false;
  financialLayout: 'Bandeau' | 'Carte' = 'Bandeau';

  private students = STUDENTS;
  query = '';
  showSuggestions = false;
  selectedId = STUDENTS[0].id;

  onQueryChange = (e: any) => {
    this.query = e.target.value;
    this.showSuggestions = this.query.length > 0;
  };
  onFocus = () => { if (this.query.length > 0) this.showSuggestions = true; };
  selectStudent = (id: string) => {
    this.selectedId = id; this.query = ''; this.showSuggestions = false;
  };

  private decorate(s: any) {
    const isFr = s.track === 'fr';
    return {
      ...s,
      select: () => this.selectStudent(s.id),
      trackBg: isFr ? '#008B47' : '#FFFFFF',
      trackColor: isFr ? '#FFFFFF' : '#008B47',
      trackBorder: isFr ? 'none' : '1.5px solid #008B47',
      sportLabel: s.sport ? 'Oui' : 'Non',
      sportBg: s.sport ? '#EAF5EE' : '#FDECE1',
      sportColor: s.sport ? '#008B47' : '#E8722C',
      redoubleLabel: s.redouble ? 'Oui' : 'Non',
      redoubleBg: s.redouble ? '#FDECE1' : '#EAF5EE',
      redoubleColor: s.redouble ? '#E8722C' : '#008B47',
      soldeFmt: formatXAF(s.solde),
      soldeColor: s.solde > 0 ? '#C0392B' : '#008B47',
      soldeBg: s.solde > 0 ? '#FDECE1' : '#EAF5EE',
      soldeBorder: s.solde > 0 ? '#F0C39E' : '#BFE3CD',
    };
  }

  private get matches() {
    const q = this.query.trim().toLowerCase();
    if (!q) return [];
    return this.students.filter(s =>
      (s.nom + ' ' + s.prenom).toLowerCase().includes(q) ||
      s.matricule.toLowerCase().includes(q) ||
      s.classe.toLowerCase().includes(q));
  }

  get suggestions() { return this.matches.slice(0, 3).map(s => this.decorate(s)); }
  get noResults() { return this.showSuggestions && this.matches.length === 0; }
  get searchMarginBottom() { return this.showSuggestions ? '4px' : '24px'; }
  private get raw() { return this.students.find(s => s.id === this.selectedId) || null; }
  get hasSelected() { return !!this.raw; }
  get hasNoSelection() { return !this.raw; }
  get selected() { return this.raw ? this.decorate(this.raw) : null; }
  get cardPadding() { return this.compactMode ? '14px 16px' : '20px 22px'; }
  get financialIsBanner() { return this.financialLayout === 'Bandeau'; }
  get financialIsCard() { return this.financialLayout === 'Carte'; }
}
