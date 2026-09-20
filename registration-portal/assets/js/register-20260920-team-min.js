const form=document.getElementById("registrationForm");
const eventSelect=document.getElementById("eventSelect");
const segmentSelect=document.getElementById("segmentSelect");
const participation=document.getElementById("participationType");
const participationWrap=document.getElementById("participationWrap");
const classGroup=document.getElementById("classGroup");
const teamSection=document.getElementById("teamSection");
const projectSection=document.getElementById("projectSection");
const teamMembers=document.getElementById("teamMembers");
const addMember=document.getElementById("addMember");
const paymentSection=document.getElementById("paymentSection");
const feeNotice=document.getElementById("feeNotice");
const rulesBox=document.getElementById("rulesBox");
const errorBox=document.getElementById("error");

let catalog=[];
let selectedEvent=null;
let selectedSegment=null;

function esc(v){
  return String(v??"")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function activeSubsegments(){
  return (selectedEvent?.subsegments||[]).filter(x=>x.registration_enabled);
}

function classesForSelection(){
  if(selectedSegment?.class_groups?.length) return selectedSegment.class_groups;
  return selectedEvent?.class_groups||[];
}

function participationTypeForSelection(){
  return selectedSegment?.participation_type || selectedEvent?.participation_type || "individual";
}
function teamBounds(){
  const source=selectedSegment || selectedEvent || {};
  const min=Math.max(1,Number(source.min_team_size)||1);
  const configuredMax=Number(source.max_team_size)||0;
  const max=configuredMax>0?Math.max(min,configuredMax):9999;
  return {min,max};
}

function updateTeamMemberControls(){
  const {min,max}=teamBounds();
  const count=teamMembers.children.length;
  [...teamMembers.children].forEach((card,i)=>{
    const remove=card.querySelector(".remove-member");
    if(remove){
      remove.style.display=count>min && i>=min?"inline-flex":"none";
      remove.disabled=count<=min;
    }
  });
  addMember.disabled=count>=max;
  addMember.textContent=count>=max?"Maximum team size reached":"+ Add member";
}

function ensureMinimumTeamMembers(){
  const {min}=teamBounds();
  while(teamMembers.children.length<min){
    addMemberCard();
  }
  updateTeamMemberControls();
}

function allowsProject(){
  const slug=selectedEvent?.slug;
  return slug==="wall-magazine" || slug==="project-display";
}

function syncSegmentOptions(){
  const all=selectedEvent?.subsegments||[];
  const open=all.filter(x=>x.registration_enabled);
  const requires=!!selectedEvent?.has_subsegments;

  segmentSelect.required=requires;
  segmentSelect.innerHTML=(requires
    ? '<option value="">Select one subsegment</option>'
    : '<option value="">Main event / no segment</option>')+
    all.map(x=>'<option value="'+esc(x.id)+'"'+(x.registration_enabled?'':' disabled')+'>'+
      esc(x.name)+(x.registration_enabled?'':' (Closed)')+'</option>').join("");

  if(selectedSegment && open.some(x=>String(x.id)===String(selectedSegment.id))){
    segmentSelect.value=selectedSegment.id;
  }else if(requires && open.length===1){
    selectedSegment=open[0];
    segmentSelect.value=open[0].id;
  }else{
    selectedSegment=null;
  }

  document.getElementById("segmentWrap").style.display=(open.length||requires)?"grid":"none";
}

function syncParticipation(){
  const t=participationTypeForSelection();
  const fixedTeam=t==="team";

  participation.innerHTML=t==="both"
    ? '<option value="individual">Individual</option><option value="team">Team</option>'
    : '<option value="'+esc(t)+'">'+esc(t.charAt(0).toUpperCase()+t.slice(1))+'</option>';

  if(fixedTeam){
    participation.value="team";
    participationWrap.style.display="none";
    participationWrap.hidden=true;
  }else{
    participationWrap.hidden=false;
    participationWrap.style.display="block";
  }

  return fixedTeam;
}

function syncDependentFields(){
  const fixedTeam=syncParticipation();

  classGroup.innerHTML='<option value="">Select class group</option>'+
    classesForSelection().map(c=>'<option value="'+esc(c.id)+'">'+esc(c.name||c.code)+'</option>').join("");

  const paid=!!(
    selectedSegment?.payment_required ||
    (!selectedSegment && selectedEvent?.payment_required)
  );
  paymentSection.style.display=paid?"block":"none";
  feeNotice.textContent=paid
    ?"Registration fee: ৳"+((selectedSegment?.fee)||(selectedEvent?.fee)||0)+". Payment details will be reviewed by the carnival team."
    :"This registration is free.";

  rulesBox.textContent=
    selectedSegment?.rules_text ||
    selectedEvent?.rules_text ||
    "Please review your event details before submitting your registration.";

  teamSection.style.display=(fixedTeam || participation.value==="team")?"block":"none";
  projectSection.style.display=allowsProject()?"block":"none";

  if(!allowsProject()) document.getElementById("projectName").value="";

  if(fixedTeam || participation.value==="team"){
    ensureMinimumTeamMembers();
  }else{
    teamMembers.innerHTML="";
    updateTeamMemberControls();
  }
}

function renderEventSelection(){
  selectedSegment=null;
  syncSegmentOptions();
  syncDependentFields();
}

function addMemberCard(){
  const {max}=teamBounds();
  if(teamMembers.children.length>=max) return;

  const n=teamMembers.children.length+1;
  const d=document.createElement("div");
  d.className="member-card";
  d.innerHTML=
    '<div class="member-head"><strong>Team member '+n+'</strong>'+
      '<button type="button" class="button ghost small remove-member">Remove</button>'+
    '</div>'+
    '<div class="member-grid">'+
      '<label>Name<input class="m-name" required></label>'+
      '<label>Email<input class="m-email" type="email" required></label>'+
      '<label>Phone<input class="m-phone" required></label>'+
      '<label>Institution<input class="m-institution" required></label>'+
      '<label>Class group<select class="m-class" required>'+
        classesForSelection().map(c=>'<option value="'+esc(c.id)+'">'+esc(c.name||c.code)+'</option>').join("")+
      '</select></label>'+
      '<label>Address<input class="m-address"></label>'+
    '</div>';

  const remove=d.querySelector(".remove-member");
  if(remove) remove.onclick=()=>{
    const {min}=teamBounds();
    if(teamMembers.children.length<=min) return;
    d.remove();
    renumberMembers();
    updateTeamMemberControls();
  };

  teamMembers.appendChild(d);
  renumberMembers();
  updateTeamMemberControls();
}

function renumberMembers(){
  [...teamMembers.children].forEach((card,i)=>{
    const title=card.querySelector(".member-head strong");
    if(title) title.textContent="Team member "+(i+1);
  });
  updateTeamMemberControls();
}

function showError(message){
  errorBox.hidden=false;
  errorBox.textContent=message;
  errorBox.scrollIntoView({behavior:"smooth",block:"center"});
}

function clearError(){
  errorBox.hidden=true;
  errorBox.textContent="";
}

eventSelect.onchange=()=>{
  selectedEvent=catalog.find(e=>String(e.id)===String(eventSelect.value))||null;
  renderEventSelection();
};

segmentSelect.onchange=()=>{
  const nextId=segmentSelect.value;
  selectedSegment=(selectedEvent?.subsegments||[]).find(
    x=>String(x.id)===String(nextId) && x.registration_enabled
  )||null;

  syncDependentFields();
  if(selectedSegment){
    segmentSelect.value=selectedSegment.id;
  }else if(selectedEvent?.has_subsegments){
    segmentSelect.value="";
  }
};

participation.onchange=()=>{
  syncDependentFields();
};

addMember.onclick=()=>{addMemberCard();};

async function boot(){
  try{
    catalog=await getCatalog();
    if(!catalog.length) throw new Error("No events are currently open for registration.");

    eventSelect.innerHTML='<option value="">Select an event</option>'+
      catalog.map(e=>'<option value="'+esc(e.id)+'">'+esc(e.name)+'</option>').join("");

    const slug=new URLSearchParams(location.search).get("event");
    const match=catalog.find(e=>e.slug===slug);
    if(match){
      eventSelect.value=match.id;
      selectedEvent=match;
    }else{
      selectedEvent=null;
    }

    renderEventSelection();
  }catch(e){
    showError(e.message||"Unable to load registration options.");
  }
}

form.onsubmit=async e=>{
  e.preventDefault();
  clearError();

  if(!selectedEvent) return showError("Please select an event.");

  if(selectedEvent.has_subsegments && !selectedSegment){
    return showError("Please select one subsegment for this event.");
  }

  const isTeam=participation.value==="team";
  const members=[...teamMembers.querySelectorAll(".member-card")].map(card=>({
    participant_name:card.querySelector(".m-name").value.trim(),
    email:card.querySelector(".m-email").value.trim(),
    phone:card.querySelector(".m-phone").value.trim(),
    institution:card.querySelector(".m-institution").value.trim(),
    class_group_id:card.querySelector(".m-class").value,
    address:card.querySelector(".m-address").value.trim()
  }));

  if(isTeam && !members.length){
    return showError("Add at least one team member.");
  }

  const paid=!!(
    selectedSegment?.payment_required ||
    (!selectedSegment && selectedEvent?.payment_required)
  );

  const payload={
    event_id:selectedEvent.id,
    subsegment_id:selectedSegment?.id||null,
    participation_type:participation.value,
    class_group_id:classGroup.value,
    participant_name:document.getElementById("participantName").value.trim(),
    email:document.getElementById("email").value.trim(),
    phone:document.getElementById("phone").value.trim(),
    institution:document.getElementById("institution").value.trim(),
    address:document.getElementById("address").value.trim(),
    team_name:document.getElementById("teamName").value.trim(),
    project_name:document.getElementById("projectName").value.trim(),
    payment_method:document.getElementById("paymentMethod").value.trim(),
    transaction_id:document.getElementById("transactionId").value.trim(),
    team_members:members
  };

  const button=form.querySelector(".submit");
  button.disabled=true;
  button.textContent="Submitting…";

  try{
    const r=await supabaseClient.rpc("submit_public_registration",{p_payload:payload});
    if(r.error) throw r.error;
    location.href="success.html?number="+encodeURIComponent(r.data.registration_number)+"&payment="+(paid?"true":"false");
  }catch(err){
    showError(err.message||"Unable to submit registration.");
  }finally{
    button.disabled=false;
    button.innerHTML='Submit registration <span>→</span>';
  }
};

boot();