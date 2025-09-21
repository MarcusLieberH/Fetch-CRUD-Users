//========== JavaScript kode til at hente og vise brugere=====================

// globale variabler
let users=[];
let editingUserId=null;

//Dom elementer (Document Object Model)
const messagesDiv= document.getElementById('messages');
const usersTable=document.getElementById('usersTable');
const userForm=document.getElementById('userForm');

window.addEventListener('load',loadUsers);
//funktion til at hente brugere fra api (Application Programming Interface)
async function fetchUsers(){
    try{
        showMessage('Henter brugere...', 'info');

        //sender request til api
        const response= await fetch('https://jsonplaceholder.typicode.com/users');

        // tjekker om requesten lykkedes
        if(!response.ok){
            throw new Error('Kunne ikke hente brugere');
        }
        // konverterer til JavaScript objekter
        const userData=await response.json();

        // gemmer brugere i array
        users=userData;

        showMessage('Brugere hentet med sucess', 'sucess');
        return users;
        // catch block hvis der forekommer fejl
    }catch(error){
        showMessage('Fejl ved hentning af brugere: ' + error.message, 'error');
        console.error('Fetch error: ', error);
    }
}
//function til at vise brugere i tabellen
function renderUsers(userArray){
    const tbody=usersTable.querySelector('tbody');

    // rydder eksisterende indhold
    tbody.innerHTML=''; // ✅ Korrekt stavning

    //Gennemgår alle brugere og laver tabel-rækker
    userArray.forEach(user => {
        const row= document.createElement('tr');
        row.setAttribute('data-user-id', user.id);

          row.innerHTML = `
            <td>${user.id}</td>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>
                <button class="edit-btn" data-action="edit">Rediger</button>
                <button class="delete-btn" data-action="delete">Slet</button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}
// Funktion til at vise beskeder til bruger
function showMessage(message, type){
    messagesDiv.textContent=message;
    messagesDiv.className=type;

    // skjuler besked efter nogle sekunder
    setTimeout(()=>{
        messagesDiv.style.display='none';
    },3000);
}

async function loadUsers(){
    await fetchUsers();
    renderUsers(users);
}

//  TODO Tilføj denne event listener efter dine andre event listeners
userForm.addEventListener('submit', handleFormSubmit);
// funktion til at håndtere form submission
async function handleFormSubmit(event){
    event.preventDefault();// stopper siden i at reloade
    
    const name = document.getElementById('userName').value;
    const email= document.getElementById('userEmail').value;

    if(editingUserId){
        //til at redigere en eksisterende bruger
        await updateUser(editingUserId, name, email);
    }else{
        // Til når vi vil oprette en ny bruger
        await createUser(name, email);
    }
}
// funktion til at oprette bruger
async function createUser(name, email){
    try{
        const response= await fetch('https://jsonplaceholder.typicode.com/users', {
            method:'POST',
            headers:{
                'Content-Type':'application/json'
            },
            body:JSON.stringify({
                name:name,
                email:email
            })
    });
    if(!response.ok){
        throw new Error('kunne ikke oprette bruger');
    }
    const newUser=await response.json();
    //tilføjer nye brugere til arrayet
    users.push(newUser);

    //Opdaterer tabellen
    renderUsers(users);

    // ryder form
    userForm.reset();

    showMessage('Bruger er blevet oprettet med sucess','sucess');

}catch(error){
    showMessage('Fejl ved oprettelse af bruger'+ error.message, 'error');
    console.error('Create error:', error);
}
}
//===================REDIGER OG SLET===================
// note, indtil videre kan man ikke redigere brugere med høje ID'er som 11,12,13. det virker kunb for id 1-10
// EventListener til rediger og slet knappen
usersTable.addEventListener('click', handleTableClick);
document.getElementById('cancelEdit').addEventListener('click', resetForm);

// håndterer klik på tabellen
function handleTableClick(event){
    const action= event.target.getAttribute('data-action');
    const row= event.target.closest('tr');
    const userId= row.getAttribute('data-user-id');

    if(action=='edit'){
        startEditUser(userId);
    }else if(action== 'delete'){
        deleteUser(userId);
    }
}
// redigering af en bruger
function startEditUser(userId){
    const user = users.find(u=> u.id==userId);

    if(user){
        // Udfyld form med brugerens data
        document.getElementById('userName').value= user.name;
        document.getElementById('userEmail').value= user.email;

        // skifter til redigering
        editingUserId=userId;

        // Viser anullerings knappen
        document.getElementById('cancelEdit').style.display='inline-block';

        showMessage('rediger bruger:'+ user.name, 'info');
    }
}

async function updateUser(userId, name, email){
try{
    const response= await fetch(`https://jsonplaceholder.typicode.com/users/${userId}`, {
        method:'PUT',
        headers:{
            'Content-Type':'application/json',
        },
        body:JSON.stringify({
            id:userId,
            name:name,
            email:email
        })
});
if(!response.ok){
    throw new Error('Kunne ikke opdaterer bruger');
}
// finder bruger og opdaterer i array
const userIndex= users.findIndex(u=> u.id== userId);
if(userIndex!==-1){
    users[userIndex].name=name;
    users[userIndex].email=email;
}

//Opdaterer tabellen
renderUsers(users);

//reset form
resetForm();
showMessage('Bruger opdateret succesfuldt','sucess');
}catch(error){
    showMessage('Fejl ved opdatering:' + error.message, 'error');
    console.error('Update Error:',error);
}
}

//Sletter en bruger funktionen
async function deleteUser(userId){
    if(!confirm('Er du sikker på at du vil slette brugeren?')){
        return;
    }
    try{
        const response= await fetch(`https://jsonplaceholder.typicode.com/users/${userId}`, {
            method:'DELETE'
    });

    if(!response.ok){
        throw new Error('Kunne ikke slette bruger');
    }

    // fjerner bruger fra array
    users=users.filter(u=> u.id!=userId);

    //opdaterer tabellen
    renderUsers(users);
    showMessage('Brugeren blev slettet sucessfuldt!', 'succes');
}catch(error){
    showMessage('Fejl ved sletning af bruger:'+ error.message, 'error');
    console.log('Delete error', error);
   }
}
// Restart form til normal tilstand
function resetForm(){
userForm.reset();
editingUserId=null;
document.getElementById('cancelEdit').style.display='none';
}
