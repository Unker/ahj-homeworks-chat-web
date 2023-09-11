const chatBtn = document.querySelector('.chat-widget__side')
const chatWidget = document.querySelector('.chat-widget')
// const input = document.querySelector('.chat-widget__input');
// const messages = document.querySelector('.chat-widget__messages');
// const chatContainer = document.querySelector('.chat-widget__messages-container');

chatBtn.addEventListener('click', (e) => {
  chatWidget.classList.add('chat-widget_active');
});



const modal = document.querySelector('.modal');
const nicknameInput = modal.querySelector('.nickname-input');
const submitButton = modal.querySelector('.nickname-submit');
const errorText = modal.querySelector('.error-text');

// Открываем модальное окно при загрузке страницы
window.addEventListener('load', () => {
  modal.style.display = 'flex';
});

// Обработчик события для кнопки "Отправить"
submitButton.addEventListener('click', async () => {
  const nickname = nicknameInput.value;

  console.log(nickname)

  // Отправляем никнейм на сервер для проверки доступности
  const isNicknameAvailable = await checkNicknameAvailability(nickname);
  if (isNicknameAvailable instanceof Error) {
    errorText.textContent = 'Сервер не доступен';
    errorText.style.display = 'block';
  } else if (isNicknameAvailable) {
    // Если никнейм доступен, открываем окно чата
    errorText.style.display = 'none';
    modal.style.display = 'none';
    chatWidget.classList.add('chat-widget_active');
  } else {
    // Иначе сообщаем пользователю, что никнейм занят
    errorText.textContent = 'Никнейм занят. Пожалуйста, выберите другой.';
    errorText.style.display = 'block';
  }

});

url = 'http://localhost:7070'

// Функция для отправки запроса на сервер для проверки доступности никнейма
async function checkNicknameAvailability(nickname) {
  try {
    const response = await fetch(`${url}/check-nickname/?nickname=${nickname}`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Ошибка при проверке никнейма');
    }

    const data = await response.json();
    return data.available;
  } catch (error) {
    console.error(error);
    return error;
  }
}




class SubscriptionApi {
  constructor(apiUrl) {
    this.apiUrl = apiUrl;
  }

  async add(user) {
    const request = fetch(this.apiUrl + 'subscriptions/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(user),
    });

    const result = await request;

    if (!result.ok) {
      console.error('Ошибка');

      return;
    }

    const json = await result.json();
    const status = json.status;

    console.log(status);
  }

  async remove(user) {
    const query = 'subscriptions/' + encodeURIComponent(user.phone);

    const request = fetch(this.apiUrl + query, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
    });

    const result = await request;

    if (!result.ok) {
      console.error('Ошибка!');

      return;
    }

    const json = await result.json();
    const status = json.status;

    console.log(status);
  }
}

const eventSource = new EventSource('http://localhost:7070/sse');

eventSource.addEventListener('open', (e) => {
  console.log(e);

  console.log('sse open');
});

eventSource.addEventListener('error', (e) => {
  console.log(e);

  console.log('sse error');
});

const subscriptions = document.querySelector('.subscriptions');

eventSource.addEventListener('message', (e) => {
  console.log(e);
  const { name, phone } = JSON.parse(e.data);

  subscriptions.appendChild(document.createTextNode(`${name} ${phone}\n`));

  console.log('sse message');
});

const ws = new WebSocket('ws://http://localhost:7070/ws');

const chat = document.querySelector('.chat-widget');
const chatMessage = chat.querySelector('.chat-widget__messages');
const chatSend = chat.querySelector('.chat-widget__input');

chatSend.addEventListener('click', () => {
  const message = chatMessage.value;

  if (!message) return;

  ws.send(message);

  chatMessage.value = '';
});

ws.addEventListener('open', (e) => {
  console.log(e);

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

ws.addEventListener('message', (e) => {
  console.log(e);

  const data = JSON.parse(e.data);
  const { chat: messages } = data;

  messages.forEach(message => {
    chat.appendChild(document.createTextNode(message) + '\n');
  });

  console.log('ws message');
});

window.api = new SubscriptionApi('http://localhost:7070/');

