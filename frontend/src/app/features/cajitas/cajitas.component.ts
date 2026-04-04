import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-cajitas',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
<div class="page-enter cajitas-page">
  <!-- BANNER -->
  <div class="caj-banner" [style.background]="banner()?.bg_gradient||'linear-gradient(135deg,#FDF6EC,#E8C99A)'">
    <div class="container">
      <div class="ban-emoji">🎁</div>
      <h1 [style.color]="banner()?.text_color||'#5C3A1E'" [style.fontFamily]="(banner()?.font||'Playfair Display')+',serif'">
        {{banner()?.title||'Cajitas Star Crumbs'}}
      </h1>
      <p [style.color]="banner()?.text_color||'#5C3A1E'">{{banner()?.subtitle||'Arma tu caja perfecta'}}</p>
    </div>
  </div>

  <div class="container section-sm">
    <div *ngIf="loading()" class="box-grid">
      <div *ngFor="let s of [1,2,3]" class="skeleton" style="height:320px;border-radius:20px"></div>
    </div>
    <div *ngIf="!loading()&&!combos().length" class="empty-st">
      <span>📦</span><h3>Próximamente</h3>
      <a routerLink="/products" class="btn btn-primary">Ver productos</a>
    </div>

    <div *ngIf="!loading()" class="box-grid">
      <div *ngFor="let combo of combos()" class="box-type-card" [class.card-sel]="selectedCombo()?.id===combo.id" (click)="selectCombo(combo)">
        <!-- CSS animated box -->
        <div class="css-box-area" [class.box-open]="hovered===combo.id" (mouseenter)="hovered=combo.id" (mouseleave)="hovered=''">
          <div class="cbox">
            <div class="cbox-lid" [style.background]="combo.accent_color||'#C9956A'">
              <span class="cbox-ribbon">🎀</span>
              <div class="cbox-stripe"></div>
            </div>
            <div class="cbox-body" [style.background]="combo.bg_color||'#E8C99A'">
              <div class="cbox-inner">
                <span *ngFor="let d of getDots(combo.max_units)" class="cbox-cookie">🍪</span>
              </div>
            </div>
          </div>
          <div class="cbox-shadow"></div>
        </div>
        <div class="box-info">
          <span class="btype-badge" [class]="'bt-'+combo.box_type">{{getTypeLabel(combo.box_type)}}</span>
          <h3>{{combo.name}}</h3>
          <p class="box-desc">{{combo.description}}</p>
          <div class="box-specs">
            <span class="bspec"><i class="fas fa-cookie-bite"></i> {{combo.max_units}} galletas</span>
            <span *ngIf="combo.category_name&&combo.box_type!=='combined'" class="bspec bspec-cat"><i class="fas fa-tag"></i> {{combo.category_name}}</span>
            <span *ngIf="combo.box_type==='combined'" class="bspec bspec-any"><i class="fas fa-shuffle"></i> Cualquier sabor</span>
          </div>
          <div *ngIf="combo.discount_percent>0" class="disc-row">
            <span class="disc-pill">-{{combo.discount_percent}}% OFF</span>
          </div>
          <button class="btn btn-primary btn-sm armar-btn">
            <i class="fas fa-box-open"></i> Armar mi cajita
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- BUILDER MODAL -->
  <div *ngIf="selectedCombo()&&builderOpen()" class="sc-overlay" (click)="closeOnOverlay($event,'sc-overlay')">
    <div class="bld-modal">
      <button class="bld-close" (click)="closeBuilder()"><i class="fas fa-times"></i></button>

      <div class="bld-header" [style.background]="selectedCombo()!.bg_color||'#F5E6D3'">
        <div class="bld-anim" [class.bld-open]="isOpen()">
          <div class="bld-lid" [style.background]="selectedCombo()!.accent_color||'#C9956A'"><span>🎀</span></div>
          <div class="bld-body" [style.background]="selectedCombo()!.accent_color||'#C9956A'">
            <div class="bld-cookies-in"><span *ngFor="let i of selectedItems()" class="bld-ck">🍪</span></div>
          </div>
        </div>
        <div class="bld-hdr-txt">
          <h2>{{selectedCombo()!.name}}</h2>
          <span class="units-pill" [class.units-done]="totalUnits()>=selectedCombo()!.max_units">
            {{totalUnits()}} / {{selectedCombo()!.max_units}} galletas
          </span>
        </div>
      </div>

      <div class="bld-body-grid">
        <!-- Products picker -->
        <div class="bld-left">
          <h4 class="pick-h">
            <i class="fas fa-cookie-bite"></i>
            {{selectedCombo()!.category_name?'Solo de: '+selectedCombo()!.category_name:'Elige tus galletas'}}
          </h4>
          <div *ngIf="loadingProd()" class="pick-loading">
            <div *ngFor="let s of [1,2,3]" class="skeleton" style="height:58px;border-radius:10px;margin-bottom:8px"></div>
          </div>
          <div class="pick-list">
            <div *ngFor="let p of availProds()" class="pick-row">
              <img [src]="p.images?.[0]||'assets/cookie-placeholder.png'" class="pick-img">
              <div class="pick-info">
                <span class="pick-name">{{p.name}}</span>
                <span class="pick-price">$ {{p.price|number:'1.0-0'}}</span>
              </div>
              <div class="pick-qty">
                <button (click)="removeItem(p)" [disabled]="getQty(p.id)===0"><i class="fas fa-minus"></i></button>
                <span [class.qty-on]="getQty(p.id)>0">{{getQty(p.id)}}</span>
                <button (click)="addItem(p)" [disabled]="totalUnits()>=selectedCombo()!.max_units"><i class="fas fa-plus"></i></button>
              </div>
            </div>
            <div *ngIf="!loadingProd()&&!availProds().length" class="no-prods"><span>🍪</span><p>Sin productos disponibles</p></div>
          </div>
        </div>

        <!-- Summary -->
        <div class="bld-right">
          <h4 class="pick-h"><i class="fas fa-receipt"></i> Tu pedido</h4>
          <div *ngIf="!selectedItems().length" class="empty-sel"><span>📦</span><p>Agrega galletas</p></div>
          <div class="sel-list">
            <div *ngFor="let it of selectedItems()" class="sel-row">
              <img [src]="it.images?.[0]||'assets/cookie-placeholder.png'" class="sel-img">
              <span class="sel-nm">{{it.name}}</span>
              <span class="sel-q">×{{it.quantity}}</span>
              <span class="sel-p">$ {{it.price*it.quantity|number:'1.0-0'}}</span>
            </div>
          </div>
          <div class="ubar"><div class="ufill" [style.width]="barPct()+'%'" [style.background]="totalUnits()>=selectedCombo()!.max_units?'#4caf50':selectedCombo()!.accent_color"></div></div>
          <p class="utxt" [class.udone]="totalUnits()===selectedCombo()!.max_units">
            {{totalUnits()===selectedCombo()!.max_units?'✅ Cajita completa!':'Faltan '+(selectedCombo()!.max_units-totalUnits())+' más'}}
          </p>
          <div class="sum-prices" *ngIf="selectedItems().length">
            <div class="sp-row" *ngIf="selectedCombo()!.discount_percent>0">
              <span>Descuento -{{selectedCombo()!.discount_percent}}%:</span>
              <span class="sp-disc">-$ {{discAmt()|number:'1.0-0'}}</span>
            </div>
            <div class="sp-row sp-total">
              <span>Total:</span>
              <span>$ {{finalTotal()|number:'1.0-0'}}</span>
            </div>
          </div>
          <div class="bld-actions" *ngIf="totalUnits()>0">
            <button class="btn btn-primary" (click)="openPay()"><i class="fas fa-bag-shopping"></i> Pagar</button>
            <a [href]="waLink()" target="_blank" class="btn-wa-sm"><i class="fab fa-whatsapp"></i> WhatsApp</a>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- PAYMENT MODAL -->
  <div *ngIf="showPay()" class="sc-overlay" (click)="closeOnOverlay($event,'sc-overlay')">
    <div class="pay-modal">
      <button class="bld-close" (click)="showPay.set(false)"><i class="fas fa-times"></i></button>
      <h3><i class="fas fa-lock"></i> Método de pago</h3>
      <p class="pay-sub">Total: <strong>$ {{finalTotal()|number:'1.0-0'}}</strong></p>

      <div class="pay-opts">
        <button class="pay-btn" [class.pay-sel]="payMethod()==='nequi'" (click)="payMethod.set('nequi')">
          <div class="picon nq-icon">N</div>
          <div><strong>Nequi</strong><span>Transferencia instantánea</span></div>
          <i *ngIf="payMethod()==='nequi'" class="fas fa-check-circle pcheck"></i>
        </button>
        <button class="pay-btn" [class.pay-sel]="payMethod()==='tarjeta'" (click)="payMethod.set('tarjeta')">
          <div class="picon cd-icon"><i class="fas fa-credit-card"></i></div>
          <div><strong>Tarjeta débito/crédito</strong><span>Pago con tarjeta</span></div>
          <i *ngIf="payMethod()==='tarjeta'" class="fas fa-check-circle pcheck"></i>
        </button>
        <button class="pay-btn" [class.pay-sel]="payMethod()==='efectivo'" (click)="payMethod.set('efectivo')">
          <div class="picon ca-icon"><i class="fas fa-money-bill-wave"></i></div>
          <div><strong>Efectivo contra entrega</strong><span>Paga al recibir</span></div>
          <i *ngIf="payMethod()==='efectivo'" class="fas fa-check-circle pcheck"></i>
        </button>
      </div>

      <!-- Nequi -->
      <div *ngIf="payMethod()==='nequi'" class="pay-detail nequi-detail">
        <div class="nq-logo"><div class="nq-n">N</div><span>Nequi</span></div>
        <div class="nq-num">321 590 3340</div>
        <p class="nq-hint">Envía el valor y adjunta el comprobante en WhatsApp</p>
        <div class="pay-links">
          <a href="https://www.nequi.com.co/" target="_blank" class="btn btn-primary btn-sm"><i class="fas fa-external-link-alt"></i> Abrir Nequi</a>
          <button class="btn btn-secondary btn-sm" (click)="copy('3215903340','Número Nequi')"><i class="fas fa-copy"></i> Copiar</button>
        </div>
      </div>

      <!-- Avanza Visa -->
      <div *ngIf="payMethod()==='tarjeta'" class="pay-detail avanza-dl">
        <div class="av-hdr"><div class="av-ic"><i class="fas fa-credit-card"></i></div><span>Avanza Visa Débito</span></div>
        <p class="av-hint">Envía <strong>$ {{finalTotal()|number:'1.0-0'}}</strong> desde tu app bancaria a la cuenta Avanza Visa Débito.</p>
        <div class="pay-links">
          <a href="https://daviplata.com" target="_blank" class="btn btn-primary btn-sm"><i class="fas fa-external-link-alt"></i> Ir a pagar</a>
          <button class="btn btn-secondary btn-sm" (click)="copy('4771700760166680','Número de tarjeta')"><i class="fas fa-copy"></i> Copiar número</button>
        </div>
      </div>

      <!-- Efectivo -->
      <div *ngIf="payMethod()==='efectivo'" class="pay-detail cash-detail">
        <span>💵</span><p>Paga en efectivo al recibir tu cajita. Ten el monto exacto: <strong>$ {{finalTotal()|number:'1.0-0'}}</strong></p>
      </div>

      <div class="pay-notes">
        <label>Notas (opcional)</label>
        <textarea [(ngModel)]="orderNotes" class="form-control" rows="2" placeholder="Dirección, indicaciones..."></textarea>
      </div>

      <button class="btn btn-primary pay-confirm" (click)="placeOrder()" [disabled]="!payMethod()||placing()">
        <i class="fas fa-check-circle"></i> {{placing()?'Procesando...':'Confirmar pedido'}}
      </button>
    </div>
  </div>
</div>
  `,
  styles: [`
    .caj-banner { padding:52px 0 36px; text-align:center; }
    .caj-banner .container { display:flex; flex-direction:column; align-items:center; gap:10px; }
    .ban-emoji { font-size:3rem; animation:bounce 2.5s infinite; }
    .caj-banner h1 { font-size:clamp(1.5rem,4vw,2.8rem); margin:0; }
    .caj-banner p { font-size:1rem; opacity:.85; margin:0; }
    .box-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(270px,1fr)); gap:24px; }
    .box-type-card { background:#fff; border-radius:var(--radius-xl); box-shadow:var(--shadow-sm); cursor:pointer; transition:all .35s ease; border:2px solid transparent; display:flex; flex-direction:column; }
    .box-type-card:hover { transform:translateY(-7px); box-shadow:var(--shadow-md); }
    .card-sel { border-color:var(--warm-capuchino); }
    /* CSS Box */
    .css-box-area { padding:28px 0 14px; display:flex; flex-direction:column; align-items:center; background:var(--almond-light); perspective:500px; }
    .cbox { width:100px; }
    .cbox-lid { width:108px; height:33px; margin-left:-4px; border-radius:7px 7px 0 0; display:flex; align-items:center; justify-content:center; position:relative; transform-origin:top center; transition:transform .65s cubic-bezier(.4,0,.2,1); box-shadow:0 -4px 10px rgba(0,0,0,.1); }
    .cbox-ribbon { font-size:1.1rem; }
    .cbox-stripe { position:absolute; width:100%; height:5px; background:rgba(255,255,255,.25); bottom:5px; }
    .cbox-body { width:100px; height:74px; border-radius:0 0 9px 9px; display:flex; align-items:center; justify-content:center; box-shadow:0 7px 18px rgba(0,0,0,.12); }
    .cbox-inner { display:flex; flex-wrap:wrap; gap:2px; justify-content:center; max-width:76px; }
    .cbox-cookie { font-size:1.05rem; opacity:.75; }
    .cbox-shadow { width:90px; height:11px; background:radial-gradient(ellipse,rgba(0,0,0,.14),transparent); margin-top:5px; border-radius:50%; }
    .box-open .cbox-lid { transform:rotateX(-118deg) translateY(-9px); }
    .box-type-card:hover .cbox-lid { transform:rotateX(-28deg); }
    /* Card info */
    .box-info { padding:18px; display:flex; flex-direction:column; gap:7px; flex:1; }
    .btype-badge { padding:3px 10px; border-radius:var(--radius-full); font-size:.7rem; font-weight:700; width:fit-content; }
    .bt-classic  { background:#e3f2fd; color:#1565c0; }
    .bt-special  { background:#fce4ec; color:#c62828; }
    .bt-combined { background:#e8f5e9; color:#2e7d32; }
    .box-info h3 { color:var(--mocca-bean); font-size:1.02rem; margin:0; }
    .box-desc { font-size:.8rem; color:var(--text-light); margin:0; min-height:30px; }
    .box-specs { display:flex; gap:6px; flex-wrap:wrap; }
    .bspec { font-size:.73rem; color:var(--text-mid); background:var(--almond-light); padding:3px 8px; border-radius:var(--radius-full); }
    .bspec-cat { background:#fff3e0; color:#e65100; }
    .bspec-any { background:#e8f5e9; color:#2e7d32; }
    .disc-row { display:flex; align-items:center; }
    .disc-pill { background:var(--error); color:#fff; padding:2px 8px; border-radius:var(--radius-full); font-size:.7rem; font-weight:700; }
    .armar-btn { width:100%; justify-content:center; margin-top:4px; }
    /* Overlays */
    .sc-overlay { position:fixed; inset:0; background:rgba(0,0,0,.6); backdrop-filter:blur(6px); display:flex; align-items:center; justify-content:center; z-index:1000; padding:12px; animation:fadeIn .2s ease; overflow-y:auto; }
    /* Builder modal */
    .bld-modal { background:#fff; border-radius:var(--radius-xl); width:100%; max-width:800px; max-height:94vh; overflow-y:auto; box-shadow:var(--shadow-lg); animation:slideUp .3s ease; position:relative; display:flex; flex-direction:column; }
    .bld-close { position:absolute; top:13px; right:13px; z-index:10; background:rgba(255,255,255,.9); border:none; cursor:pointer; width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:.9rem; color:var(--text-mid); box-shadow:var(--shadow-sm); }
    .bld-close:hover { background:var(--error); color:#fff; }
    .bld-header { padding:22px 20px 16px; display:flex; align-items:center; gap:18px; flex-shrink:0; }
    .bld-anim { width:72px; flex-shrink:0; perspective:350px; }
    .bld-lid { width:76px; height:26px; margin-left:-2px; border-radius:5px 5px 0 0; display:flex; align-items:center; justify-content:center; transform-origin:top center; transition:transform .65s cubic-bezier(.4,0,.2,1); font-size:.85rem; }
    .bld-body { width:72px; height:55px; border-radius:0 0 7px 7px; display:flex; align-items:center; justify-content:center; overflow:hidden; }
    .bld-cookies-in { display:flex; flex-wrap:wrap; gap:1px; max-width:60px; justify-content:center; }
    .bld-ck { font-size:.75rem; animation:fadeIn .3s ease; }
    .bld-open .bld-lid { transform:rotateX(-118deg) translateY(-7px); }
    .bld-hdr-txt h2 { margin:0 0 5px; color:var(--mocca-bean); font-size:1.15rem; }
    .units-pill { font-size:.82rem; font-weight:700; padding:3px 11px; border-radius:var(--radius-full); background:var(--almond-light); color:var(--text-mid); }
    .units-done { background:#e8f5e9; color:#388e3c; }
    .bld-body-grid { display:grid; grid-template-columns:1fr 320px; flex:1; min-height:0; }
    .bld-left { padding:18px; overflow-y:auto; border-right:1px solid var(--almond); max-height:480px; }
    .bld-right { padding:18px; overflow-y:auto; display:flex; flex-direction:column; gap:10px; max-height:480px; }
    .pick-h { color:var(--mocca-bean); font-size:.9rem; margin-bottom:10px; display:flex; align-items:center; gap:6px; }
    .pick-list { display:flex; flex-direction:column; gap:7px; }
    .pick-row { display:flex; align-items:center; gap:9px; padding:9px 11px; background:var(--almond-light); border-radius:var(--radius-md); }
    .pick-row:hover { background:var(--almond); }
    .pick-img { width:42px; height:42px; border-radius:var(--radius-sm); object-fit:cover; flex-shrink:0; }
    .pick-info { flex:1; }
    .pick-name { display:block; font-size:.86rem; font-weight:600; color:var(--text-dark); }
    .pick-price { font-size:.73rem; color:var(--text-light); }
    .pick-qty { display:flex; align-items:center; border:2px solid var(--almond); border-radius:var(--radius-full); overflow:hidden; background:#fff; }
    .pick-qty button { padding:5px 9px; background:none; border:none; cursor:pointer; color:var(--warm-capuchino); font-size:.73rem; }
    .pick-qty button:hover:not(:disabled) { background:var(--almond-light); }
    .pick-qty button:disabled { opacity:.3; cursor:default; }
    .pick-qty span { padding:0 9px; font-weight:700; font-size:.85rem; min-width:22px; text-align:center; color:var(--text-mid); }
    .qty-on { color:var(--warm-capuchino); }
    .empty-sel { text-align:center; padding:20px; color:var(--text-light); }
    .empty-sel span { font-size:1.8rem; display:block; margin-bottom:5px; }
    .sel-list { display:flex; flex-direction:column; gap:6px; }
    .sel-row { display:flex; align-items:center; gap:7px; padding:6px; background:var(--almond-light); border-radius:var(--radius-md); font-size:.8rem; }
    .sel-img { width:30px; height:30px; border-radius:5px; object-fit:cover; flex-shrink:0; }
    .sel-nm { flex:1; font-weight:600; color:var(--text-dark); }
    .sel-q { color:var(--text-light); }
    .sel-p { font-weight:700; color:var(--warm-capuchino); }
    .ubar { height:7px; background:var(--almond); border-radius:4px; overflow:hidden; }
    .ufill { height:100%; border-radius:4px; transition:width .3s ease,background .3s ease; }
    .utxt { font-size:.77rem; color:var(--text-light); margin-top:4px; text-align:center; }
    .udone { color:#388e3c; font-weight:700; }
    .sum-prices { border-top:1px solid var(--almond); padding-top:9px; }
    .sp-row { display:flex; justify-content:space-between; font-size:.83rem; padding:3px 0; color:var(--text-mid); }
    .sp-disc { color:#388e3c; font-weight:700; }
    .sp-total { font-size:.95rem; font-weight:700; color:var(--warm-capuchino); border-top:1px solid var(--almond); margin-top:4px; padding-top:7px; }
    .bld-actions { display:flex; flex-direction:column; gap:7px; }
    .btn-wa-sm { background:linear-gradient(135deg,#25D366,#128C7E); color:#fff; display:flex; align-items:center; justify-content:center; gap:7px; border-radius:var(--radius-full); padding:10px 20px; font-weight:700; font-size:.88rem; cursor:pointer; text-decoration:none; border:none; transition:all var(--transition); }
    .btn-wa-sm:hover { transform:translateY(-2px); color:#fff; }
    .no-prods { text-align:center; padding:24px; color:var(--text-light); }
    .no-prods span { font-size:1.6rem; display:block; margin-bottom:5px; }
    .pick-loading { display:flex; flex-direction:column; gap:7px; }
    /* Payment modal */
    .pay-modal { background:#fff; border-radius:var(--radius-xl); width:100%; max-width:450px; padding:26px; box-shadow:var(--shadow-lg); animation:slideUp .3s ease; position:relative; max-height:92vh; overflow-y:auto; }
    .pay-modal h3 { color:var(--mocca-bean); margin-bottom:4px; font-size:1.15rem; }
    .pay-sub { color:var(--text-mid); margin-bottom:18px; font-size:.88rem; }
    .pay-opts { display:flex; flex-direction:column; gap:9px; margin-bottom:16px; }
    .pay-btn { display:flex; align-items:center; gap:13px; padding:13px 15px; border:2px solid var(--almond); border-radius:var(--radius-md); background:#fff; cursor:pointer; transition:all var(--transition); text-align:left; }
    .pay-btn:hover { border-color:var(--warm-capuchino); background:var(--almond-light); }
    .pay-sel { border-color:var(--warm-capuchino); background:var(--almond-light); }
    .pay-btn div:last-of-type { flex:1; }
    .pay-btn strong { display:block; font-size:.92rem; color:var(--text-dark); }
    .pay-btn span { font-size:.77rem; color:var(--text-light); }
    .pcheck { color:var(--warm-capuchino); font-size:1.05rem; }
    .picon { width:38px; height:38px; border-radius:9px; display:flex; align-items:center; justify-content:center; font-size:1rem; font-weight:700; flex-shrink:0; }
    .nq-icon { background:#7b2d8b; color:#fff; font-size:1.1rem; }
    .cd-icon { background:linear-gradient(135deg,#1565c0,#0d47a1); color:#fff; }
    .ca-icon { background:linear-gradient(135deg,#388e3c,#1b5e20); color:#fff; }
    .pay-detail { margin-bottom:16px; }
    /* Nequi */
    .nequi-detail { background:linear-gradient(135deg,#7b2d8b,#4a148c); border-radius:var(--radius-lg); padding:20px; color:#fff; }
    .nq-logo { display:flex; align-items:center; gap:7px; margin-bottom:12px; }
    .nq-n { width:30px; height:30px; background:rgba(255,255,255,.2); border-radius:7px; display:flex; align-items:center; justify-content:center; font-weight:900; }
    .nq-logo span { font-size:1rem; font-weight:700; }
    .nq-num { font-size:1.7rem; font-weight:700; letter-spacing:3px; margin-bottom:7px; }
    .nq-hint { font-size:.8rem; opacity:.8; margin-bottom:14px; line-height:1.5; }
    .pay-links { display:flex; gap:8px; flex-wrap:wrap; }
    /* Card */
    .crd-card { background:linear-gradient(135deg,#1a237e,#1565c0); border-radius:14px; padding:18px; position:relative; overflow:hidden; box-shadow:0 10px 28px rgba(21,101,192,.4); color:#fff; margin-bottom:12px; }
    .crd-shine { position:absolute; top:-50%; right:-20%; width:60%; height:200%; background:linear-gradient(135deg,transparent,rgba(255,255,255,.08),transparent); transform:rotate(20deg); }
    .crd-chip { width:36px; height:27px; background:linear-gradient(135deg,#f9a825,#f57f17); border-radius:4px; margin-bottom:18px; display:flex; flex-direction:column; justify-content:center; padding:3px 5px; gap:3px; }
    .crd-cl { height:3px; background:rgba(0,0,0,.3); border-radius:2px; }
    .crd-num { font-size:1rem; letter-spacing:3px; font-family:monospace; font-weight:600; margin-bottom:18px; }
    .crd-bot { display:flex; gap:18px; }
    .crd-lbl { font-size:.58rem; opacity:.7; display:block; text-transform:uppercase; margin-bottom:2px; }
    .crd-val { font-size:.9rem; font-weight:700; font-family:monospace; }
    .crd-hint { font-size:.8rem; color:var(--text-mid); margin-bottom:12px; }
    .cash-detail { background:var(--almond-light); border-radius:var(--radius-lg); padding:18px; text-align:center; }
    .cash-detail span { font-size:2.2rem; display:block; margin-bottom:7px; }
    .cash-detail p { color:var(--text-mid); font-size:.88rem; }
    .pay-notes { margin-bottom:14px; }
    .pay-notes label { font-size:.8rem; font-weight:600; color:var(--text-mid); display:block; margin-bottom:4px; }
    .pay-confirm { width:100%; justify-content:center; padding:13px; font-size:.95rem; }
    .empty-st { text-align:center; padding:72px 20px; display:flex; flex-direction:column; align-items:center; gap:14px; }
    .empty-st span { font-size:3.5rem; }
    .avanza-dl { background:linear-gradient(135deg,#1a237e,#1565c0); border-radius:var(--radius-lg); padding:18px; color:#fff; }
    .av-hdr { display:flex; align-items:center; gap:8px; margin-bottom:9px; }
    .av-ic { width:30px; height:30px; background:rgba(255,255,255,.2); border-radius:7px; display:flex; align-items:center; justify-content:center; font-size:.9rem; }
    .av-hdr span { font-weight:700; }
    .av-hint { font-size:.82rem; opacity:.88; margin-bottom:13px; line-height:1.6; }
    @media(max-width:680px) {
      .bld-body-grid { grid-template-columns:1fr; }
      .bld-left { border-right:none; border-bottom:1px solid var(--almond); max-height:280px; }
      .bld-right { max-height:280px; }
      .bld-modal { max-height:97vh; }
      .box-grid { grid-template-columns:1fr; }
    }
    @media(max-width:400px) {
      .bld-header { flex-direction:column; text-align:center; }
      .pay-modal { padding:18px; }
    }
  `]
})
export class CajitasComponent implements OnInit {
  combos = signal<any[]>([]);
  loading = signal(true);
  selectedCombo = signal<any>(null);
  isOpen = signal(false);
  builderOpen = signal(false);
  availProds = signal<any[]>([]);
  loadingProd = signal(false);
  selectedItems = signal<any[]>([]);
  showPay = signal(false);
  payMethod = signal('');
  placing = signal(false);
  orderNotes = '';
  banner = signal<any>(null);
  hovered = '';

  totalUnits = computed(() => this.selectedItems().reduce((a, i) => a + i.quantity, 0));
  barPct = computed(() => {
    const c = this.selectedCombo();
    if (!c) return 0;
    return Math.min(100, (this.totalUnits() / c.max_units) * 100);
  });

  constructor(private http: HttpClient, public auth: AuthService, private toast: ToastService) {}

  ngOnInit() {
    this.http.get<any[]>(`${environment.apiUrl}/combos`).subscribe({
      next: c => { this.combos.set(c); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
    this.http.get<any>(`${environment.apiUrl}/site-settings/page_banner_cajitas`).subscribe({
      next: s => { if (s?.setting_value) this.banner.set(s.setting_value); }
    });
  }

  selectCombo(combo: any) {
    this.selectedCombo.set(combo);
    this.selectedItems.set([]);
    this.isOpen.set(false);
    this.builderOpen.set(true);
    document.body.style.overflow = 'hidden';
    setTimeout(() => this.isOpen.set(true), 280);
    this.loadingProd.set(true);
    this.http.get<any[]>(`${environment.apiUrl}/combos/${combo.id}/products`).subscribe({
      next: p => { this.availProds.set(p); this.loadingProd.set(false); },
      error: () => this.loadingProd.set(false)
    });
  }

  closeBuilder() { this.builderOpen.set(false); this.selectedCombo.set(null); this.selectedItems.set([]); this.showPay.set(false); document.body.style.overflow = ''; }
  closeOnOverlay(e: MouseEvent, cls: string) { if ((e.target as HTMLElement).classList.contains(cls)) this.closeBuilder(); }

  getQty(id: string) { return this.selectedItems().find(i => i.id === id)?.quantity || 0; }

  addItem(p: any) {
    if (this.totalUnits() >= this.selectedCombo()!.max_units) return;
    const cur = [...this.selectedItems()];
    const idx = cur.findIndex(i => i.id === p.id);
    if (idx >= 0) cur[idx] = { ...cur[idx], quantity: cur[idx].quantity + 1 };
    else cur.push({ ...p, quantity: 1 });
    this.selectedItems.set(cur);
  }

  removeItem(p: any) {
    const cur = [...this.selectedItems()];
    const idx = cur.findIndex(i => i.id === p.id);
    if (idx < 0) return;
    if (cur[idx].quantity <= 1) cur.splice(idx, 1);
    else cur[idx] = { ...cur[idx], quantity: cur[idx].quantity - 1 };
    this.selectedItems.set(cur);
  }

  discAmt() {
    const c = this.selectedCombo();
    if (!c) return 0;
    const base = c.price_per_unit > 0 ? c.price_per_unit * this.totalUnits() : this.selectedItems().reduce((a, i) => a + i.price * i.quantity, 0);
    return Math.round(base * c.discount_percent / 100);
  }

  finalTotal() {
    const c = this.selectedCombo();
    if (!c) return 0;
    const base = c.price_per_unit > 0 ? c.price_per_unit * this.totalUnits() : this.selectedItems().reduce((a, i) => a + i.price * i.quantity, 0);
    return Math.round(base * (1 - (c.discount_percent || 0) / 100));
  }

  openPay() {
    if (!this.auth.isLoggedIn) { this.toast.info('Inicia sesión para pedir'); return; }
    if (!this.selectedItems().length) { this.toast.error('Agrega galletas a tu cajita'); return; }
    this.showPay.set(true);
  }

  placeOrder() {
    if (!this.payMethod()) { this.toast.error('Selecciona un método de pago'); return; }
    this.placing.set(true);
    const items = this.selectedItems().map(i => ({ product_id: i.id, quantity: i.quantity }));
    this.http.post(`${environment.apiUrl}/combos/${this.selectedCombo()!.id}/order`, {
      selected_items: items, payment_method: this.payMethod(), notes: this.orderNotes
    }).subscribe({
      next: () => { this.placing.set(false); this.toast.success('¡Cajita pedida! 🎁'); this.closeBuilder(); },
      error: (e) => { this.placing.set(false); this.toast.error(e.error?.message || 'Error al procesar el pedido'); }
    });
  }

  copy(text: string, label: string) {
    navigator.clipboard.writeText(text).then(() => this.toast.success(label + ' copiado 📋'));
  }

  waLink() {
    const c = this.selectedCombo();
    if (!c) return '#';
    const items = this.selectedItems().map(i => `${i.name} ×${i.quantity}`).join(', ');
    const msg = encodeURIComponent(`Hola! 🎁 Quiero pedir:\n*${c.name}* (${this.totalUnits()} und)\n📦 ${items}\n💰 Total: $${this.finalTotal().toLocaleString('es-CO')}\n\n¿Está disponible?`);
    return `https://wa.me/573215903340?text=${msg}`;
  }

  getDots(n: number) { return Array(Math.min(n, 6)).fill(0); }
  getTypeLabel(t: string) { const m: any = { classic: '🍪 Clásica', special: '⭐ Especial', combined: '🎲 Combinada' }; return m[t] || t; }
}
