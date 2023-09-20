const url = process.env.SERVER_URL || 'http://localhost:7070';

class ChatApi {
  constructor(apiUrl) {
    this.apiUrl = apiUrl;
    this.nickName = undefined;

    // элементы чата
    this.chat = document.querySelector('.chat-widget');
    this.inputMsg = document.querySelector('.chat-widget__input');
    this.chatMessage = document.querySelector('.chat-widget__messages');
    this.chatContainer = document.querySelector('.chat-widget__messages-container');

    this.usersWidget = document.querySelector('.users-widget__area');
    this.usersList = document.querySelector('.users-widget__list');

    // элементы модального окна с вводом никнейма
    this.modal = document.querySelector('.modal');
    this.nicknameInput = this.modal.querySelector('.nickname-input');
    this.submitButton = this.modal.querySelector('.nickname-submit');
    this.errorText = this.modal.querySelector('.error-text');

    this.#getUserNameModal();

    this.ws = new WebSocket(`${this.apiUrl.replace(/http/, 'ws')}/ws`);
    this.#initWs(this.ws);

    // console.log('this.token',this.token)
    // this.eventSource = new EventSource(`${this.apiUrl}/sseUsers?token=${this.token}`);
    // this.#initEventSource(this.eventSource);
    this.#bindEventSourse(this.token);
  }

  // отобразить принятое сообщение в чате
  showMsg(msg, time, user) {
    const isMyMsg = user === this.nickName;
    const nickNameMsg = isMyMsg ? 'You' : user;
    this.chatMessage.innerHTML += `
      <div class="message ${isMyMsg ? 'message_client' : ''}">
        <div class="message__time">${nickNameMsg}, ${time}</div>
        <div class="message__text">${msg}</div>
      </div>
    `;
    this.scrollToBottom();
  }

  // отобразить список пользователей в чате
  showUsers(nickNames) {
    this.usersList.innerHTML = '';
    nickNames.sort().forEach((name) => {
      this.usersList.innerHTML += `
            <li class="user__list">${name}</li>
          `;
    });
  }

  // прокрутку окна чата до блока последнего комментария
  scrollToBottom() {
    this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
  }

  #initWs(ws) {
    // отправка сообщений
    this.inputMsg.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.repeat === false) {
        const msg = this.inputMsg.value.trim();
        if (msg) {
          const data = {
            message: msg,
            nickName: this.nickName,
          };
          ws.send(JSON.stringify(data));
          this.inputMsg.value = '';
        }
      }
    });

    // прием сообщения
    ws.addEventListener('message', (e) => {
      const data = JSON.parse(e.data);
      console.log('Messages:', data);
      data.forEach((receive) => {
        const { time, user, message } = receive;
        this.showMsg(message, time, user);
      });
    });

    ws.addEventListener('open', (e) => {
      console.log('ws open');
    });

    ws.addEventListener('close', (e) => {
      console.log('ws close');
    });

    ws.addEventListener('error', (e) => {
      console.log('ws error');
    });
  }

  #initEventSource(eventSource) {
    eventSource.addEventListener('updateUser', (e) => {
      console.log('sse message', e.data);
      const nickNames = JSON.parse(e.data);
      this.showUsers(nickNames);
    });

    eventSource.addEventListener('open', (e) => {
      // console.log(e);
      console.log('sse open');
    });

    eventSource.addEventListener('error', (e) => {
      console.log(e);
      console.log('sse error');
    });
  }

  #bindEventSourse(token) {
    console.log('this.token', token);
    this.eventSource = new EventSource(`${this.apiUrl}/sseUsers?token=${token}`);
    this.#initEventSource(this.eventSource);
  }

  #getUserNameModal() {
    // Открываем модальное окно при загрузке страницы
    window.addEventListener('load', () => {
      this.modal.style.display = 'flex';
    });

    // Обработчик события для кнопки "Отправить"
    this.submitButton.addEventListener('click', async () => {
      this.#tryConnectToChat();
    });
    this.nicknameInput.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter' || e.keyCode === 13) {
        this.#tryConnectToChat();
      }
    });
  }

  async #tryConnectToChat() {
    const nickname = this.nicknameInput.value;

    console.log(nickname);

    // Отправляем никнейм на сервер для проверки доступности
    const [isNicknameAvailable, token] = await this.checkNicknameAvailability(nickname);
    if (isNicknameAvailable instanceof Error) {
      this.errorText.textContent = 'Сервер не доступен';
      this.errorText.style.display = 'block';
    } else if (isNicknameAvailable) {
      // Если никнейм доступен, открываем окно чата
      this.errorText.style.display = 'none';
      this.modal.style.display = 'none';
      this.chat.classList.add('chat-widget_active');
      this.nickName = nickname;
      this.token = token;
      this.#bindEventSourse(token);
    } else {
      // Иначе сообщаем пользователю, что никнейм занят
      this.errorText.textContent = 'Никнейм занят. Пожалуйста, выберите другой.';
      this.errorText.style.display = 'block';
    }
  }

  // Функция для отправки запроса на сервер для проверки доступности никнейма
  async checkNicknameAvailability(nickname) {
    try {
      const response = await fetch(`${this.apiUrl}/check-nickname/?nickname=${nickname}`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.available === undefined) {
          throw new Error('Ошибка взаимодейтсвия с сервером');
        }
      }

      return [data.available, data.token];
    } catch (error) {
      console.error(error);
      return error;
    }
  }
}

window.api = new ChatApi(url);
