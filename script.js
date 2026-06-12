// Полная конфигурация со STUN и TURN серверами для обхода любого NAT (домашнего и мобильного)
const peer = new Peer({
    host: 'mrkricalo-semejka-voice-server.hf.space', 
    port: 443, 
    secure: true,
    path: '/',
    config: {
        'iceServers': [
            { url: 'stun:stun.l.google.com:19302' },
            { url: 'stun:stun1.l.google.com:19302' },
            { url: 'stun:stun2.l.google.com:19302' },
            // Бесплатные TURN-сервера для обхода жестких ограничений провайдеров
            {
                urls: 'turn:openrelay.metered.ca:80',
                username: 'openrelayproject',
                credential: 'openrelayproject'
            },
            {
                urls: 'turn:openrelay.metered.ca:443',
                username: 'openrelayproject',
                credential: 'openrelayproject'
            }
        ],
        'iceTransportPolicy': 'all'
    }
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

const incomingModal = document.getElementById('incomingModal');
const answerBtn = document.getElementById('answer-btn');
const declineBtn = document.getElementById('decline-btn');

// Запрашиваем микрофон
navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    .then(stream => {
        localStream = stream;
    })
    .catch(err => {
        alert('Нужен доступ к микрофону для работы SEMEJKA VOICE.');
    });

peer.on('open', id => {
    myIdEl.innerText = id;
});

peer.on('error', err => {
    console.error('Ошибка PeerJS:', err);
    resetCallSession();
});

function initMobileAudio() {
    remoteAudio.play().catch(() => {});
    remoteAudio.pause();
}

// Кнопка "Позвонить"
callBtn.addEventListener('click', () => {
    const friendId = peerIdInput.value.trim();
    if (!friendId) return alert('Введите ID друга!');
    if (!localStream) return alert('Микрофон еще не готов.');

    initMobileAudio();

    showScreen('call');
    statusText.innerText = 'Набор номера...';
    avatarBox.classList.add('calling');

    const call = peer.call(friendId, localStream);
    handleCallLogic(call);
});

// Входящий вызов
peer.on('call', call => {
    if (!localStream) return;
    incomingCallData = call;
    incomingModal.classList.add('active');
});

// Кнопка "Принять"
answerBtn.addEventListener('click', () => {
    if (incomingCallData) {
        initMobileAudio();

        incomingModal.classList.remove('active');
        showScreen('call');
        statusText.innerText = 'Соединение...';
        avatarBox.classList.add('calling');
        
        incomingCallData.answer(localStream);
        handleCallLogic(incomingCallData);
    }
});

// Кнопка "Отклонить"
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
        remoteAudio.play()
            .then(() => {
                statusText.innerText = 'Разговор...';
            })
            .catch(e => {
                console.error("Ошибка воспроизведения:", e);
                statusText.innerText = 'Разговор (нажмите на экран для звука)';
            });
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
        muteBtn.classList.toggle('muted', isMuted);
    }
});

function showScreen(type) {
    mainScreen.classList.toggle('active', type === 'main');
    callScreen.classList.toggle('active', type === 'call');
}

function resetCallSession() {
    if (currentCall) {
        currentCall.off('stream');
        currentCall.off('close');
        currentCall.off('error');
    }
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
