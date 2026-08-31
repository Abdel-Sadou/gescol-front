import { Component } from '@angular/core';
import { CobimagBase } from '../../shared/cobimag-base';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
})
export class LoginComponent extends CobimagBase {
  tab: 'login' | 'signup' = 'login';
  loginHidden = true;
  signupHidden = true;
  signupPassword = '';

  selectLoginTab = (e?: Event) => { e?.preventDefault(); this.tab = 'login'; };
  selectSignupTab = (e?: Event) => { e?.preventDefault(); this.tab = 'signup'; };
  toggleLoginPassword = (e?: Event) => { e?.preventDefault(); this.loginHidden = !this.loginHidden; };
  toggleSignupPassword = (e?: Event) => { e?.preventDefault(); this.signupHidden = !this.signupHidden; };
  onSignupPasswordChange = (e: any) => { this.signupPassword = e.target.value; };

  get isLogin() { return this.tab === 'login'; }
  get isSignup() { return this.tab === 'signup'; }
  get loginTabColor() { return this.isLogin ? '#008B47' : '#5F6161'; }
  get loginTabBorder() { return this.isLogin ? '#008B47' : 'transparent'; }
  get signupTabColor() { return this.isSignup ? '#008B47' : '#5F6161'; }
  get signupTabBorder() { return this.isSignup ? '#008B47' : 'transparent'; }
  get loginPasswordType() { return this.loginHidden ? 'password' : 'text'; }
  get loginPasswordHidden() { return this.loginHidden; }
  get signupPasswordType() { return this.signupHidden ? 'password' : 'text'; }
  get signupPasswordHidden() { return this.signupHidden; }
  get showStrength() { return this.signupPassword.length > 0; }

  private get strength() {
    const pwd = this.signupPassword;
    if (!pwd) return { pct: '0%', color: '#EEEEEC', label: '' };
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 10) score++;
    if (/[0-9]/.test(pwd) && /[a-zA-Z]/.test(pwd)) score++;
    if (/[^a-zA-Z0-9]/.test(pwd)) score++;
    if (score <= 1) return { pct: '30%', color: '#E8722C', label: 'Faible' };
    if (score === 2) return { pct: '65%', color: '#E8722C', label: 'Moyen' };
    return { pct: '100%', color: '#008B47', label: 'Fort' };
  }
  get strengthPct() { return this.strength.pct; }
  get strengthColor() { return this.strength.color; }
  get strengthLabel() { return this.strength.label; }
}
