(() => {
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
  let selectedClassGroups=[];

  const esc=v=>String(v??"")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");

  function normalizeGroups(source){
    const seen=new Set();
    return (Array.isArray(source)?source:[])
      .map(c=>({id:String(c?.id??""),label:String(c?.name||c?.code||"").trim()}))
      .filter(c=>c.id&&c.label)
      .filter(c=>{if(seen.has(c.id))return false;seen.add(c.id);return true;});
  }

  function refreshSelectedClassGroups(){
    selectedClassGroups=normalizeGroups(
      selectedSegment?.class_groups?.length
        ? selectedSegment.class_groups
        : (selectedEvent?.class_groups||[])
    );
  }

  function rebuildSelect(select,groups,preserve=""){
    if(!select)return;
    select.replaceChildren();
    const placeholder=new Option("Select class group","");
    select.appendChild(placeholder);
    groups.forEach(group=>select.appendChild(new Option(group.label,group.id)));
    if(preserve && groups.some(group=>group.id===String(preserve))){
      select.value=String(preserve);
    }else{
      select.value="";
    }
  }

  function refreshAllMemberClassSelects(){
    teamMembers.querySelectorAll(".m-class").forEach(select=>{
      rebuildSelect(select,selectedClassGroups,select.value);
    });
  }

  function participationType(){
    return selectedSegment?.participation_type || selectedEvent?.participation_type || "individual";
  }

  function teamBounds(){
    const source=selectedSegment || selectedEvent || {};
    const min=Math.max(1,Number(source.min_team_size)||1);
    const rawMax=Number(source.max_team_size)||0;
    const max=rawMax>0?Math.max(min,rawMax):9999;
    return {min,max};
  }

  function updateTeamControls(){
    const {min,max}=teamBounds();
    const count=teamMembers.children.length;
    [...teamMembers.children].forEach((card,index)=>{
      const remove=card.querySelector(".remove-member");
      if(remove){
        const canRemove=count>min && index>=min;
        remove.hidden=!canRemove;
        remove.disabled=!canRemove;
      }
    });
    const atMax=count>=max;
    addMember.disabled=atMax;
    addMember.hidden=atMax;
    addMember.textContent=atMax?"Maximum team size reached":"+ Add member";
  }

  function addMemberCard(){
    const {max}=teamBounds();
    if(teamMembers.children.length>=max){
      updateTeamControls();
      return;
    }

    const card=document.createElement("div");
    card.className="member-card";
    card.innerHTML=
      '<div class="member-head"><strong>Team member '+(teamMembers.children.length+1)+'</strong>'+
      '<button type="button" class="button ghost small remove-member" hidden>Remove</button></div>'+
      '<div class="member-grid">'+
      '<label>Name<input class="m-name" required></label>'+
      '<label>Email<input class="m-email" type="email" required></label>'+
      '<label>Phone<input class="m-phone" required></label>'+
      '<label>Institution<input class="m-institution" required></label>'+
      '<label>Class group<select class="m-class" required></select></label>'+
      '<label>Address<input class="m-address"></label>'+
      '</div>';

    teamMembers.appendChild(card);
    rebuildSelect(card.querySelector(".m-class"),selectedClassGroups);

    card.querySelector(".remove-member").onclick=()=>{
      const {min}=teamBounds();
      if(teamMembers.children.length<=min)return;
      card.remove();
      renumberMembers();
      updateTeamControls();
    };

    renumberMembers();
    updateTeamControls();
  }

  function ensureMinimumTeamMembers(){
    const {min,max}=teamBounds();
    while(teamMembers.children.length<min && teamMembers.children.length<max){
      addMemberCard();
    }
    updateTeamControls();
  }

  function renumberMembers(){
    [...teamMembers.children].forEach((card,index)=>{
      const title=card.querySelector(".member-head strong");
      if(title)title.textContent="Team member "+(index+1);
    });
  }

  function allowsProject(){
    const slug=selectedEvent?.slug;
    return slug==="wall-magazine" || slug==="project-display";
  }

  function syncSegmentOptions(){
    const all=Array.isArray(selectedEvent?.subsegments)?selectedEvent.subsegments:[];
    const open=all.filter(s=>s.registration_enabled);
    const requires=!!selectedEvent?.has_subsegments;
    segmentSelect.required=requires;

    segmentSelect.replaceChildren();
    segmentSelect.appendChild(new Option(
      requires?"Select one subsegment":"Main event / no segment",""
    ));

    all.forEach(s=>{
      const option=new Option(
        s.registration_enabled?s.name:(s.name+" (Closed)"),
        String(s.id)
      );
      option.disabled=!s.registration_enabled;
      segmentSelect.appendChild(option);
    });

    if(selectedSegment && open.some(s=>String(s.id)===String(selectedSegment.id))){
      segmentSelect.value=String(selectedSegment.id);
    }else if(requires && open.length===1){
      selectedSegment=open[0];
      segmentSelect.value=String(open[0].id);
    }else{
      selectedSegment=null;
    }

    refreshSelectedClassGroups();
    document.getElementById("segmentWrap").style.display=(open.length||requires)?"grid":"none";
  }

  function syncFields(){
    refreshSelectedClassGroups();

    const type=participationType();
    const fixedTeam=type==="team";

    participation.replaceChildren();
    if(type==="both"){
      participation.appendChild(new Option("Individual","individual"));
      participation.appendChild(new Option("Team","team"));
    }else{
      participation.appendChild(new Option(type.charAt(0).toUpperCase()+type.slice(1),type));
    }
    participation.value=fixedTeam?"team":(participation.value||type);

    if(fixedTeam){
      participationWrap.hidden=true;
      participationWrap.style.display="none";
    }else{
      participationWrap.hidden=false;
      participationWrap.style.display="grid";
    }

    rebuildSelect(classGroup,selectedClassGroups,classGroup.value);
    refreshAllMemberClassSelects();

    const paid=!!(selectedSegment?.payment_required || (!selectedSegment && selectedEvent?.payment_required));
    paymentSection.style.display=paid?"block":"none";
    feeNotice.textContent=paid
      ?"Registration fee: ৳"+((selectedSegment?.fee)||(selectedEvent?.fee)||0)+". Payment details will be reviewed by the carnival team."
      :"This registration is free.";

    rulesBox.textContent=selectedSegment?.rules_text || selectedEvent?.rules_text ||
      "Please review your event details before submitting your registration.";

    teamSection.style.display=(fixedTeam || participation.value==="team")?"block":"none";
    projectSection.style.display=allowsProject()?"block":"none";

    if(!allowsProject())document.getElementById("projectName").value="";

    if(fixedTeam || participation.value==="team"){
      ensureMinimumTeamMembers();
    }else{
      teamMembers.replaceChildren();
      updateTeamControls();
    }
  }

  function selectEvent(){
    selectedEvent=catalog.find(e=>String(e.id)===String(eventSelect.value))||null;
    selectedSegment=null;
    selectedClassGroups=[];
    teamMembers.replaceChildren();
    syncSegmentOptions();
    syncFields();
  }

  eventSelect.addEventListener("change",selectEvent);

  segmentSelect.addEventListener("change",()=>{
    const id=segmentSelect.value;
    selectedSegment=(selectedEvent?.subsegments||[]).find(
      s=>String(s.id)===String(id) && s.registration_enabled
    )||null;

    refreshSelectedClassGroups();
    syncFields();

    if(selectedSegment)segmentSelect.value=String(selectedSegment.id);
  });

  participation.addEventListener("change",syncFields);
  addMember.addEventListener("click",addMemberCard);

  function showError(message){
    errorBox.hidden=false;
    errorBox.textContent=message;
    errorBox.scrollIntoView({behavior:"smooth",block:"center"});
  }

  async function boot(){
    try{
      catalog=await getCatalog();
      if(!catalog.length)throw new Error("No events are currently open for registration.");

      eventSelect.replaceChildren(new Option("Select an event",""));
      catalog.forEach(e=>eventSelect.appendChild(new Option(e.name,String(e.id))));

      const slug=new URLSearchParams(location.search).get("event");
      const match=catalog.find(e=>e.slug===slug);
      if(match){
        eventSelect.value=String(match.id);
        selectedEvent=match;
      }

      syncSegmentOptions();
      syncFields();
    }catch(error){
      showError(error.message||"Unable to load registration options.");
    }
  }

  form.addEventListener("submit",async e=>{
    e.preventDefault();
    errorBox.hidden=true;

    if(!selectedEvent)return showError("Please select an event.");
    if(selectedEvent.has_subsegments&&!selectedSegment){
      return showError("Please select one subsegment for this event.");
    }

    const isTeam=participation.value==="team";
    const {min,max}=teamBounds();
    const cards=[...teamMembers.querySelectorAll(".member-card")];

    if(isTeam && (cards.length<min || cards.length>max)){
      return showError("This team must contain between "+min+" and "+max+" members.");
    }

    const members=cards.map(card=>({
      participant_name:card.querySelector(".m-name").value.trim(),
      email:card.querySelector(".m-email").value.trim(),
      phone:card.querySelector(".m-phone").value.trim(),
      institution:card.querySelector(".m-institution").value.trim(),
      class_group_id:card.querySelector(".m-class").value,
      address:card.querySelector(".m-address").value.trim()
    }));

    const paid=!!(selectedSegment?.payment_required || (!selectedSegment && selectedEvent?.payment_required));

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
      if(r.error)throw r.error;
      location.href="success.html?number="+encodeURIComponent(r.data.registration_number)+"&payment="+(paid?"true":"false");
    }catch(error){
      showError(error.message||"Unable to submit registration.");
    }finally{
      button.disabled=false;
      button.innerHTML='Submit registration <span>→</span>';
    }
  });

  boot();
})();