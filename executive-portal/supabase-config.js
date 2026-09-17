const SUPABASE_URL = "https://tbwrjorqzumjyiptglkf.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_4M5j4srqXIEb3CjvG_gEQQ_0pqss3FG";

// Staff role controls are mounted here so the Staff page can use the protected
// Supabase role-change RPC without exposing privileged role details in the UI.
(function mountStaffRoleControls(){
  if(!/\/staff(?:\.html)?$/.test(window.location.pathname)) return;

  const mount = async () => {
    if(!window.supabase?.createClient) return;
    const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
    const { data: profileRows, error: profileError } = await client.rpc('get_my_staff_profile');
    if(profileError || !profileRows?.[0]) return;

    const actor = profileRows[0];
    if(!['supreme_executive','higher_executive'].includes(actor.role)) return;

    const eligible = role => actor.role === 'supreme_executive'
      ? ['higher_executive','segment_executive','member'].includes(role)
      : ['segment_executive','member'].includes(role);

    const label = role => ({
      higher_executive:'Core Executive',
      segment_executive:'Segment Manager',
      member:'Volunteer'
    }[role] || 'Staff');

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'roleControlModal';
    modal.setAttribute('aria-hidden','true');
    modal.innerHTML = `
      <article class="staff-modal" role="dialog" aria-modal="true" aria-labelledby="roleControlTitle">
        <header class="modal-head">
          <div>
            <div class="modal-kicker">Access Controls</div>
            <div class="modal-title" id="roleControlTitle">Change staff role</div>
            <div class="modal-subtitle" id="roleControlSubtitle">—</div>
          </div>
          <button class="modal-close" id="closeRoleControl" type="button" aria-label="Close">×</button>
        </header>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label" for="roleControlName">Staff member</label>
            <input class="form-control" id="roleControlName" type="text" readonly>
          </div>
          <div class="form-group">
            <label class="form-label" for="roleControlSelect">New operational role</label>
            <select class="form-control" id="roleControlSelect">
              <option value="higher_executive">Core Executive</option>
              <option value="segment_executive">Segment Manager</option>
              <option value="member">Volunteer</option>
            </select>
          </div>
          <div class="confirm-note">Role changes are validated by the protected Supabase function. Higher Executives can manage Volunteers and Segment Managers; only the protected top-level account can alter an existing Higher Executive.</div>
        </div>
        <footer class="modal-footer">
          <button class="modal-action" id="cancelRoleControl" type="button">Cancel</button>
          <button class="modal-action primary" id="saveRoleControl" type="button">Save Role</button>
        </footer>
      </article>`;
    document.body.appendChild(modal);

    let current = null;
    const open = person => {
      current = person;
      document.getElementById('roleControlName').value = person.full_name || 'Unnamed';
      document.getElementById('roleControlSubtitle').textContent = `${label(person.role)} · current role`;
      document.getElementById('roleControlSelect').value = person.role === 'higher_executive' ? 'higher_executive' : person.role === 'segment_executive' ? 'segment_executive' : 'member';
      modal.classList.add('open');
      modal.setAttribute('aria-hidden','false');
      document.body.style.overflow='hidden';
    };
    const close = () => {
      current = null;
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden','true');
      document.body.style.overflow='';
    };

    document.getElementById('closeRoleControl').addEventListener('click', close);
    document.getElementById('cancelRoleControl').addEventListener('click', close);
    modal.addEventListener('click', event => { if(event.target === modal) close(); });

    document.getElementById('saveRoleControl').addEventListener('click', async () => {
      if(!current) return;
      const button = document.getElementById('saveRoleControl');
      const newRole = document.getElementById('roleControlSelect').value;
      if(!eligible(current.role)){
        alert('This account cannot be changed by the current executive level.');
        return;
      }
      if(newRole === current.role){ close(); return; }
      button.disabled = true;
      button.textContent = 'Saving…';
      try{
        const { error } = await client.rpc('change_staff_role', {
          p_staff_id: current.id,
          p_new_role: newRole
        });
        if(error) throw error;
        close();
        window.location.reload();
      }catch(error){
        console.error(error);
        alert(`Unable to change staff role.\n\n${error.message || error}`);
      }finally{
        button.disabled = false;
        button.textContent = 'Save Role';
      }
    });

    const decorate = () => {
      const rows = document.querySelectorAll('#staffTableBody tr.staff-row');
      rows.forEach(row => {
        if(row.querySelector('[data-role-control]')) return;
        const actionCell = row.lastElementChild;
        if(!actionCell) return;
        const statusButton = actionCell.querySelector('[data-status-id]');
        if(!statusButton) return;
        const staffId = statusButton.getAttribute('data-status-id');
        const person = window.__staffRoleDirectory?.find(item => String(item.id) === String(staffId));
        if(!person || !eligible(person.role) || ['pending','rejected'].includes(person.account_status)) return;
        const roleButton = document.createElement('button');
        roleButton.className = 'table-action';
        roleButton.type = 'button';
        roleButton.textContent = 'Change Role';
        roleButton.dataset.roleControl = staffId;
        roleButton.style.marginLeft = '6px';
        roleButton.addEventListener('click', () => open(person));
        actionCell.appendChild(roleButton);
      });
    };

    const captureDirectory = async () => {
      const table = document.querySelector('#staffTableBody');
      if(!table) return;
      const { data, error } = await client
        .from('staff_management_directory')
        .select('id,full_name,role,account_status');
      if(error) return;
      window.__staffRoleDirectory = data || [];
      decorate();
    };

    const table = document.getElementById('staffTableBody');
    if(table){
      new MutationObserver(() => setTimeout(() => { captureDirectory(); }, 0)).observe(table, {childList:true, subtree:true});
      setTimeout(() => { captureDirectory(); }, 300);
    }
  };

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, {once:true});
  else mount();
})();
