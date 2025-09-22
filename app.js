//========== JavaScript kode til at hente og vise brugere=====================

// globale variabler
let users=[]; // array til at gemme brugere fra API'et
let editingUserId=null;// holder styr på hvilken bruger vi redigerer( null er lig med ingen redigering)

//// DOM ELEMENTER - finder HTML elementer og gemmer dem i variabler (Document Object Model)
const messagesDiv= document.getElementById('messages');// Div til at vise beskeder til brugeren
const usersTable=document.getElementById('usersTable');// Tabel til at vise brugere
const userForm=document.getElementById('userForm');// Form til at oprette/redigere brugere

// EVENT LISTENER - lytter til når siden er færdig med at loade
window.addEventListener('load',loadUsers);// Når siden loader, kør loadUsers funktionen

//========== HENTNING AF DATA FRA API ========== (Application Programming Interface)

// ASYNC FUNKTION - kan bruge 'await' til at vente på svar fra serveren
async function fetchUsers(){
    try{// Prøver at køre denne kode
        showMessage('Henter brugere...', 'info');// Vis "loading" besked til brugeren

        // FETCH REQUEST - sender HTTP GET request til API'et og venter på svar
        const response= await fetch('https://jsonplaceholder.typicode.com/users');

        // TJEK OM REQUEST LYKKEDES - response.ok er true hvis status er 200-299
        if(!response.ok){
            throw new Error('Kunne ikke hente brugere');// Kast en fejl hvis request fejlede
        }
        // KONVERTER RESPONSE TIL JAVASCRIPT - .json() parser JSON tekst til objekter
        const userData=await response.json();

        // GEM DATA I GLOBAL VARIABEL - så andre funktioner kan bruge det
        users=userData;

        showMessage('Brugere hentet med sucess', 'sucess');// viser SUCCESS BESKED 
        return users;// Returner brugere til den der kaldte funktionen


        // catch block hvis der forekommer fejl i try blokken
    }catch(error){
        // viser fejlbesked til brugeren
        showMessage('Fejl ved hentning af brugere: ' + error.message, 'error');
        // logger fejl til console for debugging
        console.error('Fetch error: ', error);
    }
}

//========== VISNING AF BRUGERE I TABEL ==========


// FUNKTION TIL AT BYGGE HTML TABEL med brugerdata
function renderUsers(userArray){
    // FIND TBODY ELEMENT i tabellen (hvor rækker skal indsættes)
    const tbody=usersTable.querySelector('tbody');

    // RYD EKSISTERENDE INDHOLD - fjern alle tidligere rækker
    tbody.innerHTML='';

    // LOOPER GENNEM ALLE BRUGERE og laver en række for hver
    userArray.forEach(user => {
        // opretter ny tabel række element
        const row= document.createElement('tr');

        // TILFØJER DATA ATTRIBUT med bruger ID. Som bruges til at identificere række
        row.setAttribute('data-user-id', user.id);

// SÆT INDHOLD AF RÆKKE med template literal (backticks tillader ${variable})
          row.innerHTML = `
            <td>${user.id}</td>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>
                <button class="edit-btn" data-action="edit">Rediger</button>
                <button class="delete-btn" data-action="delete">Slet</button>
            </td>
        `;
        // TILFØJ RÆKKE TIL TABEL - appendChild sætter den som barn af tbody
        tbody.appendChild(row);
    });
}

//========== BESKED SYSTEM ==========

// Funktion til at vise beskeder til bruger
function showMessage(message, type){
    console.log("Viser besked:", message, "Type:", type);
    // SÆT BESKED TEKST i messages div'en
    messagesDiv.textContent=message;

    // SÆT CSS KLASSE for styling (success = grøn, error = rød, info = blå)
    messagesDiv.className=type;

    messagesDiv.style.display='block';//gør beskeden synlig øjeblikkeligt

    if(window.messageTimeout){
        clearTimeout(window.messageTimeout);// topper enhver eksisterende timer (vigtig for hurtige handlinger)
    }

    // SKJUL BESKED EFTER 5 SEKUNDER automatisk
    setTimeout(()=>{
        messagesDiv.style.display='none';// Skjul elementet
    },5000);// 3000 millisekunder = 5 sekunder
}

//========== INITIAL LOADING ==========

// FUNKTION DER KØRER NÅR SIDEN LOADER
async function loadUsers(){
    await fetchUsers();// Vent på at brugere bliver hentet fra API
    renderUsers(users);// Vis brugerne i tabellen
}

//========== FORM HÅNDTERING ==========

// EVENT LISTENER for form submission
userForm.addEventListener('submit', handleFormSubmit);

// FUNKTION TIL AT HÅNDTERE når form submittes
async function handleFormSubmit(event){

    event.preventDefault();// stopper siden i at reloade

    // HENT VÆRDIER fra form felterne
    const name = document.getElementById('userName').value;
    const email= document.getElementById('userEmail').value;

    // TJEK OM VI REDIGERER eller opretter ny bruger
    if(editingUserId){
        // VI REDIGERER bruger - kald update funktion med eksisterende bruger ID
        await updateUser(editingUserId, name, email);
    }else{
        // VI OPRETTER NY bruger - kald create funktion
        await createUser(name, email);
    }
}

//========== OPRETTELSE AF NY BRUGER ==========

// funktion til at oprette bruger
async function createUser(name, email){
    try{
         // SEND POST REQUEST til API med bruger data
        const response= await fetch('https://jsonplaceholder.typicode.com/users', {
            method:'POST',// POST bruges til at oprette nye data
            headers:{
                'Content-Type':'application/json'// Fortæller serveren vi sender JSON
            },
            body:JSON.stringify({// Konverter JavaScript objekt til JSON string
                name:name,
                email:email
            })
    });
    // TJEK OM OPRETTELSE LYKKEDES
    if(!response.ok){
        throw new Error('kunne ikke oprette bruger');
    }
    // HENT NY BRUGER fra response (serveren returnerer den oprettede bruger)
    const newUser=await response.json();

    //tilføjer nye brugere til det lokale array
    users.push(newUser);

    //Opdaterer tabellen, for at vise nye brugere
    renderUsers(users);

    // ryder form felterne
    userForm.reset();

    //viser success besked
    showMessage('Bruger er blevet oprettet med sucess','sucess');

}catch(error){
    // viser fejl besked hvis der gik noget galt
    showMessage('Fejl ved oprettelse af bruger'+ error.message, 'error');
    console.error('Create error:', error);
}
}
//===================REDIGER OG SLET===================
// note, indtil videre kan man ikke redigere brugere med høje ID'er som 11,12,13. det virker kun for id 1-10
//Redigering fejler fordi koden forsøger at sende en PUT request til serveren med et ID den ikke kender

// event listener for at klikke på tabel
usersTable.addEventListener('click', handleTableClick);

// eventlistener for at anuller knappen
document.getElementById('cancelEdit').addEventListener('click', resetForm);

//========== TABEL KLIK HÅNDTERING ==========


// Funktion til at håndtere klik på rediger/slet knap
function handleTableClick(event){
    // henter action fra den knap der bliver klikket på
    const action= event.target.getAttribute('data-action');

    // finder rækken for den knap der blev klikket på
    const row= event.target.closest('tr');

    //henter bruger id fra rækken
    const userId= row.getAttribute('data-user-id');



    //tjekker hvilken handling der udføres
    if(action=='edit'){
        startEditUser(userId);// start redigering af bruger
    }else if(action== 'delete'){
        deleteUser(userId);// slet bruger
    }
}

//========== START REDIGERING ==========


// funktion til redigering af en bruger
function startEditUser(userId){
    //find bruger i array baseret på id
    const user = users.find(u=> u.id==userId);

    if(user){// hvis bruger blev fundet
        // Udfyld form med brugerens data
        document.getElementById('userName').value= user.name;
        document.getElementById('userEmail').value= user.email;

        // SÆT GLOBAL VARIABEL til at huske hvilken bruger vi redigerer
        editingUserId=userId;

        // VIS ANNULLER KNAP så bruger kan stoppe redigering
        document.getElementById('cancelEdit').style.display='inline-block';

        // VIS INFO BESKED om hvem der redigeres
        showMessage('rediger bruger:'+ user.name, 'info');
    }
}


//========== OPDATERING AF BRUGER ==========

// FUNKTION TIL AT OPDATERE bruger på serveren
async function updateUser(userId, name, email){
try{
     // SEND PUT REQUEST til API med opdateret data
    const response= await fetch(`https://jsonplaceholder.typicode.com/users/${userId}`, {
        method:'PUT', // PUT bruges til at opdatere eksisterende data
        headers:{
            'Content-Type':'application/json',
        },
        body:JSON.stringify({// Send opdateret bruger data (JSON.stringify - Konverter til tekst)
            id:userId,
            name:name,
            email:email
        })
});

// TJEK OM OPDATERING LYKKEDES
if(!response.ok){
    throw new Error('Kunne ikke opdatere bruger');
}
// FIND BRUGER INDEX i vores lokale array
const userIndex= users.findIndex(u=> u.id== userId);

// OPDATER BRUGER i lokale array hvis fundet
if(userIndex!==-1){
    users[userIndex].name=name;
    users[userIndex].email=email;
}

// OPDATER TABEL for at vise ændringerne
renderUsers(users);

   // RESET FORM til normal tilstand
resetForm();
showMessage('Bruger opdateret succesfuldt','sucess');// VIS SUCCESS BESKED
}catch(error){
    // VIS FEJL BESKED hvis opdatering fejlede
    showMessage('Fejl ved opdatering:' + error.message, 'error');
    console.error('Update Error:',error);
}
}

//========== SLETNING AF BRUGER ==========

//Sletter en bruger funktionen
async function deleteUser(userId){
    //  - spørg bruger om de er sikre på at slette
    if(!confirm('Er du sikker på at du vil slette brugeren?')){
        return;// Stop funktionen hvis bruger siger nej
    }
    try{
        // SEND DELETE REQUEST til API
        const response= await fetch(`https://jsonplaceholder.typicode.com/users/${userId}`, {
            method:'DELETE'// DELETE bruges til at fjerne data
    });
 // TJEK OM SLETNING LYKKEDES
    if(!response.ok){
        throw new Error('Kunne ikke slette bruger');
    }

    // FJERN BRUGER fra lokale array ved at filtrere den ud
    users=users.filter(u=> u.id!=userId);

    // OPDATER TABEL for at fjerne den slettede bruger
    renderUsers(users);
    showMessage('Brugeren blev slettet sucessfuldt!', 'succes');// success besked
}catch(error){
    // fejlbesked hvis sletning fejler
    showMessage('Fejl ved sletning af bruger:'+ error.message, 'error');
    console.log('Delete error', error);
   }
}

//========== FORM RESET ==========

// Restart form til normal tilstand
function resetForm(){
userForm.reset();// Ryd alle form felter
editingUserId=null;// Stop redigering mode
document.getElementById('cancelEdit').style.display='none';// Skjul annuller knap
}
