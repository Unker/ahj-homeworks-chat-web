url = 'http://localhost:7070'


class ChatApi {
  constructor(apiUrl) {
    this.apiUrl = apiUrl;
    this.nickName = undefined;

    // элементы чата
    this.chat = document.querySelector('.chat-widget');
    this.inputMsg = document.querySelector('.chat-widget__input');
    this.chatMessage = document.querySelector('.chat-widget__messages');
    this.chatContainer = document.querySelector('.chat-widget__messages-container');

    // элементы моального окна с вводом никнейма
    this.modal = document.querySelector('.modal');
    this.nicknameInput = modal.querySelector('.nickname-input');
    this.submitButton = modal.querySelector('.nickname-submit');
    this.errorText = modal.querySelector('.error-text');

    this.#getUserNameModal();

    this.ws = new WebSocket(apiUrl.replace(/http/, 'ws') + '/ws');

    this.#initWs(this.ws);
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
    `
    this.scrollToBottom();
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
          }
          ws.send(JSON.stringify(data));
          this.inputMsg.value = '';
        }
      }
    });

    // прием сообщения
    ws.addEventListener('message', (e) => {
      const data = JSON.parse(e.data);
      console.log('Messages:', data);
      data.forEach(d => {
        const { time, user, message } = d;
        console.log(time, user, message);
        this.showMsg(message, time, user)
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
        this.chat.classList.add('chat-widget_active');
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

});


window.api = new ChatApi(url);

