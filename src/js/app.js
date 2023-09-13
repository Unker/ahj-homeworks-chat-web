// const chatBtn = document.querySelector('.chat-widget__side')
// const input = document.querySelector('.chat-widget__input');
// const messages = document.querySelector('.chat-widget__messages');
// const chatContainer = document.querySelector('.chat-widget__messages-container');

// chatBtn.addEventListener('click', (e) => {
//   chatWidget.classList.add('chat-widget_active');
// });





url = 'http://localhost:7070'






class ChatApi {
  constructor(apiUrl) {
    this.apiUrl = apiUrl;
    this.nickName = undefined;

    this.chatWidget = document.querySelector('.chat-widget');
    this.inputChat = document.querySelector('.chat-widget__input');
    this.messages = document.querySelector('.chat-widget__messages');
    this.chatContainer = document.querySelector('.chat-widget__messages-container');

    this.modal = document.querySelector('.modal');
    this.nicknameInput = modal.querySelector('.nickname-input');
    this.submitButton = modal.querySelector('.nickname-submit');
    this.errorText = modal.querySelector('.error-text');

    this.#getUserNameModal();

    // this.inputChat.addEventListener('keydown', (e) => {
    //   if (e.key === 'Enter' && e.repeat === false) {
    //     const msg = this.inputChat.value.trim();
    //     if (msg) {
    //       // отправим сообщение и очистим поле ввода
    //       sendMsg(msg, true);
    //       this.inputChat.value = '';
    //     }
    //   }
    // });
  }

  #getUserNameModal() {
    // Открываем модальное окно при загрузке страницы
    window.addEventListener('load', () => {
      this.modal.style.display = 'flex';
    });

    // Обработчик события для кнопки "Отправить"
    this.submitButton.addEventListener('click', async () => {
      const nickname = this.nicknameInput.value;

      console.log(nickname)

      // Отправляем никнейм на сервер для проверки доступности
      const isNicknameAvailable = await this.checkNicknameAvailability(nickname);
      if (isNicknameAvailable instanceof Error) {
        this.errorText.textContent = 'Сервер не доступен';
        this.errorText.style.display = 'block';
      } else if (isNicknameAvailable) {
        // Если никнейм доступен, открываем окно чата
        this.errorText.style.display = 'none';
        this.modal.style.display = 'none';
        this.chatWidget.classList.add('chat-widget_active');
        this.nickName = nickname;
      } else {
        // Иначе сообщаем пользователю, что никнейм занят
        this.errorText.textContent = 'Никнейм занят. Пожалуйста, выберите другой.';
        this.errorText.style.display = 'block';
      }

    });

  }

  // Функция для отправки запроса на сервер для проверки доступности никнейма
  async checkNicknameAvailability(nickname) {
    try {
      const response = await fetch(`${this.apiUrl}/check-nickname/?nickname=${nickname}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Ошибка взаимодейтсвия с сервером');
      }

      const data = await response.json();
      return data.available;
    } catch (error) {
      console.error(error);
      return error;
    }
  }


}



const subscriptions = document.querySelector('.subscriptions');
const eventSource = new EventSource('http://localhost:7070/sseUsers');

eventSource.addEventListener('open', (e) => {
  // console.log(e);
  console.log('sse open');
});

eventSource.addEventListener('error', (e) => {
  console.log(e);
  console.log('sse error');
});

eventSource.addEventListener('updateUser', (e) => {
  console.log('message sse', e.data);
  const nickNames = JSON.parse(e.data);
  console.log('nickNames sse', nickNames);

  // subscriptions.appendChild(document.createTextNode(`${nickName}\n`));

});




const ws = new WebSocket('ws://localhost:7070/ws');

const chat = document.querySelector('.chat-widget');
const chatMessage = chat.querySelector('.chat-widget__messages');
const inputMsg = chat.querySelector('.chat-widget__input');
const chatContainer = document.querySelector('.chat-widget__messages-container');


inputMsg.addEventListener('keydown', (e) => {
  // const message = chatMessage.value;
  // if (!message) return;
  console.log('inputMsg event');
  if (e.key === 'Enter' && e.repeat === false) {
    const msg = inputMsg.value.trim();
    if (msg) {
      // отправим сообщение и очистим поле ввода
      data = {
        message: msg,
        nickName: 'asd123', // todo set
      }
      ws.send(JSON.stringify(data));
      inputMsg.value = '';
    }
  }

  // ws.send(message);
  // chatMessage.value = '';
});

ws.addEventListener('open', (e) => {
  // console.log(e);
  console.log('ws open');
});

ws.addEventListener('close', (e) => {
  console.log(e);
  console.log('ws close');
});

ws.addEventListener('error', (e) => {
  console.log(e);
  console.log('ws error');
});

// прием сообщения
ws.addEventListener('message', (e) => {
  console.log('ws message');
  // console.log(e);
  const data = JSON.parse(e.data);
  console.log('Messages:');
  data.forEach(d => {
    const { time, user, message } = d;
    console.log(time, user, message);
    showMsg(message, time, user)
    // chat.appendChild(document.createTextNode(message) + '\n');

  });
});

// отправить сообщение в чат
function showMsg(msg, time, user) {
  const isMyMsg = user === 'asd123';//this.nickName;
  nickName = isMyMsg ? 'You' : user;
  chatMessage.innerHTML += `
  <div class="message ${isMyMsg ? 'message_client' : ''}">
    <div class="message__time">${nickName}, ${time}</div>
    <div class="message__text">${msg}</div>
  </div>
  `
  scrollToBottom();
}

// прокрутку окна чата до блока последнего комментария
function scrollToBottom() {
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

window.api = new ChatApi('http://localhost:7070');

