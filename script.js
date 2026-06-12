const peer = new Peer({
    host: 'mrkricalo-semejka-voice-server.hf.space', 
    port: 443, 
    secure: true,
    path: '/'
});

let localStream = null;
let currentCall = null;
let isMuted = false;
let incomingCallData = null;

const mainScreen = document.getElementById('mainScreen');
const callScreen = document.getElementById('callScreen');
const myIdEl = document.getElementById('my-id');
const peerIdInput = document.getElementById('peer-id');
const callBtn = document.getElementById('call-btn');
const muteBtn = document.getElementById('mute-btn');
const hangupBtn = document.getElementById('hangup-btn');
const statusText = document.getElementById('status');
const avatarBox = document.getElementById('avatarBox');
const remoteAudio = document.getElementById('remote-audio');

// Элементы модального окна
const incomingModal = document.getElementById('incomingModal');
const answerBtn = document.getElementById('answer-btn');
const declineBtn = document.getElementById('decline-btn');

navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    .then(stream => {
        localStream = stream;
    })
    .catch(err => {
        alert('Нужен доступ к микрофону для совершения звонков.');
    });

peer.on('open', id => {
    myIdEl.innerText = id;
});

peer.on('error', err => {
    console.error('Ошибка PeerJS:', err);
    resetCallSession();
});

// Кнопка "Позвонить"
callBtn.addEventListener('click', () => {
    const friendId = peerIdInput.value.trim();
    if (!friendId) return alert('Введите ID друга!');
    if (!localStream) return alert('Микрофон еще не готов.');

    showScreen('call');
    statusText.innerText = 'Набор номера...';
    avatarBox.classList.add('calling');

    const call = peer.call(friendId, localStream);
    handleCallLogic(call);
});

// Поймали входящий звонок — показываем окно «Принять/Отклонить»
peer.on('call', call => {
    if (!localStream) return;
    
    incomingCallData = call;
    incomingModal.classList.add('active'); // Показываем окно
});

// Нажали «Принять» (Тап по экрану дает браузеру право включить звук!)
answerBtn.addEventListener('click', () => {
    if (incomingCallData) {
        incomingModal.classList.remove('active');
        showScreen('call');
        statusText.innerText = 'Разговор...';
        avatarBox.classList.add('calling');
        
        incomingCallData.answer(localStream);
        handleCallLogic(incomingCallData);
    }
});

// Нажали «Отклонить»
declineBtn.addEventListener('click', () => {
    if (incomingCallData) {
        incomingCallData.close();
    }
    incomingModal.classList.remove('active');
    incomingCallData = null;
});

function handleCallLogic(call) {
    currentCall = call;

    call.on('stream', remoteStream => {
        remoteAudio.srcObject = remoteStream;
        // Принудительный старт для мобилок
        remoteAudio.play().catch(e => console.log("Автозапуск заблокирован, нужен клик"));
        statusText.innerText = 'Разговор...';
    });

    call.on('close', () => { resetCallSession(); });
    call.on('error', () => { resetCallSession(); });
}

hangupBtn.addEventListener('click', () => {
    if (currentCall) currentCall.close();
    resetCallSession();
});

muteBtn.addEventListener('click', () => {
    if (localStream) {
        isMuted = !isMuted;
        localStream.getAudioTracks()[0].enabled = !isMuted;
        muteBtn.innerText = isMuted ? 'Вкл. микро' : 'Выкл. микро';
        if (isMuted) muteBtn.classList.add('muted'); else muteBtn.classList.remove('muted');
    }
});

function showScreen(type) {
    mainScreen.classList.toggle('active', type === 'main');
    callScreen.classList.toggle('active', type === 'call');
}

function resetCallSession() {
    currentCall = null;
    incomingCallData = null;
    avatarBox.classList.remove('calling');
    remoteAudio.srcObject = null;
    incomingModal.classList.remove('active');
    showScreen('main');
    isMuted = false;
    if (localStream) localStream.getAudioTracks()[0].enabled = true;
    muteBtn.innerText = 'Выкл. микро';
    muteBtn.classList.remove('muted');
}
