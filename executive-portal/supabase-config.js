const SUPABASE_URL = "https://tbwrjorqzumjyiptglkf.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_4M5j4srqXIEb3CjvG_gEQQ_0pqss3FG";

/* Global navigation: keep the executive sidebar usable even if a page-specific data script fails. */
(function mountGlobalNavigation(){
  const safeRoutes = new Set(['dashboard.html','events.html','registrations.html','payments.html','staff.html','assignments.html','checkin.html','reports.html','settings.html']);
  const pageBuild='20260918-r4';
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-route]');
    if(!button) return;
    const route = button.dataset.route;
    if(!safeRoutes.has(route)) return;
    event.preventDefault();
    const url = new URL(route, window.location.href);
    if(/^(registrations|assignments|payments|staff|reports|settings|checkin|events|dashboard)\\.html$/.test(route)) url.searchParams.set('v',pageBuild);
    window.location.assign(url.href);
  });
})();

/* Readability pass: make the smallest operational labels easier to read without enlarging the main UI excessively. */
(function improveSmallTextReadability(){
  const style = document.createElement('style');
  style.id = 'ep-small-text-readability';
  style.textContent = `
    .ep-brand-subtitle,.ep-sidebar-label,.ep-nav-meta,.ep-user-role,.ep-header-kicker,.ep-system-state,.ep-signout,.ep-command-label,.ep-command-note,.ep-status-meta,.ep-empty,.ep-loading,.ep-stat-label,.ep-table th,.ep-kicker,.ep-badge { font-size: 11px !important; }
    .ep-page-description,.ep-surface-subheading,.ep-action-description,.ep-alert-copy,.ep-error { font-size: 12px !important; }
    .ep-user-name,.ep-action-title,.ep-status-copy,.ep-alert-title { font-size: 12px !important; }
  `;
  document.head.appendChild(style);
})();

/* Staff role controls: use the database role for authorization, while displaying Core Executive for both executive tiers. */
(function mountStaffRoleControls(){
  if(!/\/staff(?:\.html)?$/.test(window.location.pathname)) return;
  const start = () => {
    if(!window.supabase?.createClient) return;
    const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
    let actorRole = null;
    let current = null;
    const roleLabel = role => ({higher_executive:'Core Executive',segment_executive:'Segment Manager',member:'Volunteer',supreme_executive:'Core Executive'}[role] || 'Staff');
    const roleFromLabel = text => {
      const value = String(text || '').toLowerCase();
      if(value.includes('segment manager')) return 'segment_executive';
      if(value.includes('volunteer')) return 'member';
      if(value.includes('core executive')) return 'higher_executive';
      return null;
    };
    const canChange = targetRole => actorRole === 'supreme_executive' ? ['higher_executive','segment_executive','member'].includes(targetRole) : actorRole === 'higher_executive' ? ['segment_executive','member'].includes(targetRole) : false;
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'roleControlModal';
    modal.setAttribute('aria-hidden','true');
    modal.innerHTML = `<article class="staff-modal" role="dialog" aria-modal="true" aria-labelledby="roleControlTitle"><header class="modal-head"><div><div class="modal-kicker">Access Controls</div><div class="modal-title" id="roleControlTitle">Change staff role</div><div class="modal-subtitle" id="roleControlSubtitle">—</div></div><button class="modal-close" id="closeRoleControl" type="button" aria-label="Close">×</button></header><div class="modal-body"><div class="form-group"><label class="form-label" for="roleControlName">Staff member</label><input class="form-control" id="roleControlName" type="text" readonly></div><div class="form-group"><label class="form-label" for="roleControlSelect">New operational role</label><select class="form-control" id="roleControlSelect"><option value="higher_executive">Core Executive</option><option value="segment_executive">Segment Manager</option><option value="member">Volunteer</option></select></div><div class="confirm-note">Core Executive role changes follow the protected executive hierarchy.</div></div><footer class="modal-footer"><button class="modal-action" id="cancelRoleControl" type="button">Cancel</button><button class="modal-action primary" id="saveRoleControl" type="button">Save Role</button></footer></article>`;
    document.body.appendChild(modal);
    const close = () => { current = null; modal.classList.remove('open'); modal.setAttribute('aria-hidden','true'); document.body.style.overflow=''; };
    const open = person => { current = person; document.getElementById('roleControlName').value = person.name || 'Staff member'; document.getElementById('roleControlSubtitle').textContent = `${roleLabel(person.role)} · current role`; document.getElementById('roleControlSelect').value = person.role; document.getElementById('roleControlSelect').querySelector('option[value="higher_executive"]').hidden = actorRole !== 'supreme_executive'; modal.classList.add('open'); modal.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; };
    document.getElementById('closeRoleControl').addEventListener('click', close);
    document.getElementById('cancelRoleControl').addEventListener('click', close);
    modal.addEventListener('click', event => { if(event.target === modal) close(); });
    document.getElementById('saveRoleControl').addEventListener('click', async () => { if(!current) return; const newRole = document.getElementById('roleControlSelect').value; if(!canChange(current.role)){ alert('This staff member cannot be changed by your executive level.'); return; } if(newRole === current.role){ close(); return; } const button = document.getElementById('saveRoleControl'); button.disabled = true; button.textContent = 'Saving…'; try { const { error } = await client.rpc('change_staff_role', {p_staff_id: current.id, p_new_role: newRole}); if(error) throw error; window.location.reload(); } catch(error) { console.error(error); alert(`Unable to change staff role.\n\n${error.message || error}`); } finally { button.disabled = false; button.textContent = 'Save Role'; } });
    const decorate = () => { document.querySelectorAll('#staffTableBody tr.staff-row').forEach(row => { if(row.querySelector('[data-role-control]')) return; const actionCell = row.lastElementChild; if(!actionCell) return; const statusButton = actionCell.querySelector('[data-status-id]'); if(!statusButton) return; const targetRole = roleFromLabel(row.children[1]?.textContent || ''); if(!targetRole || !canChange(targetRole)) return; const personName = row.children[0]?.textContent?.trim() || 'Staff member'; const roleButton = document.createElement('button'); roleButton.className = 'table-action'; roleButton.type = 'button'; roleButton.textContent = 'Change Role'; roleButton.dataset.roleControl = statusButton.getAttribute('data-status-id'); roleButton.style.marginLeft = '6px'; roleButton.addEventListener('click', () => open({id: statusButton.getAttribute('data-status-id'), name: personName, role: targetRole})); actionCell.appendChild(roleButton); }); };
    const loadActor = async () => { const {data,error}=await client.rpc('get_my_staff_profile'); if(error || !data?.[0]) return; actorRole=data[0].role; decorate(); };
    const table=document.getElementById('staffTableBody');
    if(table){ new MutationObserver(decorate).observe(table,{childList:true,subtree:true}); loadActor(); setTimeout(decorate,250); setTimeout(decorate,1000); }
  };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true}); else start();
})();

/* Registration role compatibility: never rewrite the real database role. The registrations page already maps both executive tiers to Core Executive. */
(function preserveRegistrationsExecutiveRole(){
  if(!/\/registrations(?:\.html)?$/.test(window.location.pathname)) return;
  if(!window.supabase?.createClient) return;
  const originalCreateClient = window.supabase.createClient.bind(window.supabase);
  window.supabase.createClient = function(...args){
    const client = originalCreateClient(...args);
    return client;
  };
})();
