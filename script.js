// Подключение к твоему личному серверу сигналов на Hugging Face Spaces
const peer = new Peer({
    host: 'mrkricalo-semejka-voice-server.hf.space', 
    port: 443, 
    secure: true,
    path: '/'
});

let localStream = null;
let currentCall = null;
let isMuted = false;

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

// Запрашиваем доступ к микрофону
navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    .then(stream => {
        localStream = stream;
    })
    .catch(err => {
        alert('Нужен доступ к микрофону для совершения звонков.');
        console.error('Ошибка доступа к микрофону:', err);
    });

// Успешное подключение к твоему серверу Hugging Face и получение ID
peer.on('open', id => {
    myIdEl.innerText = id;
});

// Обработка ошибок соединения
peer.on('error', err => {
    console.error('Ошибка PeerJS:', err);
    if (err.type === 'peer-unavailable') {
        alert('Не удалось найти собеседника с таким ID. Проверьте правильность ввода.');
        resetCallSession();
    } else {
        alert('Ошибка связи с сервером. Попробуйте обновить страницу.');
    }
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

// Обработка входящего вызова (Автоответчик)
peer.on('call', call => {
    if (!localStream) return;
    
    call.answer(localStream);
    showScreen('call');
    statusText.innerText = 'Входящий звонок...';
    avatarBox.classList.add('calling');
    
    handleCallLogic(call);
});

function handleCallLogic(call) {
    currentCall = call;

    call.on('stream', remoteStream => {
        remoteAudio.srcObject = remoteStream;
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
        
        if (isMuted) {
            muteBtn.innerText = 'Вкл. микро';
            muteBtn.classList.add('muted');
        } else {
            muteBtn.innerText = 'Выкл. micro';
            muteBtn.classList.remove('muted');
        }
    }
});

function showScreen(type) {
    if (type === 'main') {
        mainScreen.classList.add('active');
        callScreen.classList.remove('active');
    } else {
        mainScreen.classList.remove('active');
        callScreen.classList.add('active');
    }
}

function resetCallSession() {
    currentCall = null;
    avatarBox.classList.remove('calling');
    remoteAudio.srcObject = null;
    showScreen('main');
    isMuted = false;
    if (localStream) localStream.getAudioTracks()[0].enabled = true;
    muteBtn.innerText = 'Выкл. микро';
    muteBtn.classList.remove('muted');
}
