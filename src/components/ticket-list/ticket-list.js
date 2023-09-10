import './ticket-list.css';

export default class TicketList {
  constructor(url) {
    this.url = url;
    this.addTicketButton = document.querySelector('.addTicketButton');
    this.ticketList = document.querySelector('.ticketList');
    this.ticketModal = document.querySelector('.ticketModal');
    this.deleteModal = document.querySelector('.deleteModal');
    this.confirmButton = document.querySelector('.confirmButton');
    this.cancelButton = document.querySelector('.cancelButton');
    this.modalBackground = document.querySelector('.modal-background');
    this.tickets = [];

    this.#createFormTicket();

    this.openAddTicketModal = this.openAddTicketModal.bind(this);
    this.confirmDeleteTicket = this.confirmDeleteTicket.bind(this);
    this.closeModals = this.closeModals.bind(this);

    this.addTicketButton.addEventListener('click', this.openAddTicketModal);
    this.confirmButton.addEventListener('click', this.confirmDeleteTicket);
    this.cancelButton.addEventListener('click', this.closeModals);

    this.loadTickets();
  }

  async loadTickets() {
    try {
      const response = await fetch(`${this.url}/?method=allTickets`);
      if (!response.ok) {
        throw new Error('Failed to load tickets');
      }
      this.tickets = await response.json();
      this.displayTickets();
    } catch (error) {
      console.error(error);
      this.ticketList.innerHTML = 'Server connection error';
    }
  }

  // Функция для отображения тикетов в списке
  displayTickets() {
    this.ticketList.innerHTML = '';
    this.tickets.forEach((ticket, index) => {
      const ticketItem = document.createElement('div');
      ticketItem.classList.add('ticket-item');
      ticketItem.setAttribute('data-index', index);
      this.onClickTicket = this.onClickTicket.bind(this);
      ticketItem.addEventListener('click', this.onClickTicket);

      // поле для отображения основной информации
      const mainContainer = document.createElement('div');
      mainContainer.classList.add('main-container');

      // поле для отображения дополнительной информации
      const extreContainer = document.createElement('div');
      extreContainer.classList.add('extra-container');

      const statusCheckbox = document.createElement('input');
      statusCheckbox.type = 'checkbox';
      statusCheckbox.classList.add('status-checkbox');
      statusCheckbox.checked = ticket.status;
      mainContainer.appendChild(statusCheckbox);

      const nameSpan = document.createElement('span');
      nameSpan.textContent = ticket.name;
      mainContainer.appendChild(nameSpan);

      const dateSpan = document.createElement('span');
      dateSpan.classList.add('ticket-created');
      const date = new Date(ticket.created);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0'); // Месяцы начинаются с 0
      const year = String(date.getFullYear()).slice(-2); // Получаем последние две цифры года
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');

      dateSpan.textContent = `${day}.${month}.${year} ${hours}:${minutes}`;
      mainContainer.appendChild(dateSpan);

      const editButton = document.createElement('button');
      editButton.textContent = '✎';
      editButton.classList.add('edit-button');
      mainContainer.appendChild(editButton);

      const deleteButton = document.createElement('button');
      deleteButton.textContent = 'x';
      deleteButton.classList.add('delete-button');
      mainContainer.appendChild(deleteButton);

      if (ticket.description) {
        const descriptionSpan = document.createElement('pre');
        descriptionSpan.classList.add('ticket-description');
        descriptionSpan.textContent = ticket.description;
        extreContainer.appendChild(descriptionSpan);
      }

      ticketItem.appendChild(mainContainer);
      ticketItem.appendChild(extreContainer);
      this.ticketList.appendChild(ticketItem);
    });
  }

  // изменить стату тикета
  async patchTicketStatus(ticket) {
    const index = ticket.getAttribute('data-index');
    const { id } = this.tickets[index];

    try {
      const response = await fetch(`${this.url}/?method=editTicket&id=${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: !this.tickets[index].status,
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to create ticket');
      }
      // считаем и отобразим обновленные тикеты
      this.loadTickets();
    } catch (error) {
      console.error(error);
    }
  }

  async getTicketDescription(ticket) {
    const index = ticket.getAttribute('data-index');

    // получить подробную информацию о тикете
    const { id } = this.tickets[index];
    try {
      const response = await fetch(`${this.url}/?method=ticketById&id=${id}`, {
        method: 'GET',
      });
      if (!response.ok) {
        throw new Error('Failed to get ticket');
      }
      return response.json();
    } catch (error) {
      console.error(error);
      return null;
    }
    // this.closeModals();
  }

  async onClickTicket(e) {
    e.preventDefault();
    const { target } = e;
    const ticket = target.closest('.ticket-item');
    const index = ticket.getAttribute('data-index');

    if (target.classList.contains('status-checkbox')) {
      // изменить статус тикета
      this.patchTicketStatus(ticket);
    } else if (target.classList.contains('edit-button')) {
      // изменить содержимое тикета
      this.openEditTicketModal(ticket);
    } else if (target.classList.contains('delete-button')) {
      // удалить тикет
      this.openDeleteModal(index);
    } else {
      // читаем полное описание тикета и отображаем
      const ticketFull = await this.getTicketDescription(ticket);
      if (ticketFull) {
        this.tickets[index] = ticketFull;
        const descriptionElem = ticket.querySelector('.ticket-description');
        // если уже отображен, то прячем описание
        if (descriptionElem && descriptionElem.style.display !== 'none') {
          descriptionElem.style.display = 'none';
        } else {
          this.displayTickets();
        }
      }
    }
  }

  openAddTicketModal() {
    const title = this.ticketModal.querySelector('.form-title');
    title.textContent = 'Добавить тикет';
    this.ticketModal.style.display = 'block';
    this.modalBackground.style.display = 'block';

    const nameElem = this.ticketModal.querySelector('.form-input-name');
    const descriptionElem = this.ticketModal.querySelector('.form-input-description');

    nameElem.value = '';
    descriptionElem.value = '';

    // форсируем изменение поля textarea по содержимому
    const event = new Event('input');
    descriptionElem.dispatchEvent(event);
  }

  async openEditTicketModal(ticket) {
    const index = ticket.getAttribute('data-index');
    this.indexSelectedTicket = index;
    const title = this.ticketModal.querySelector('.form-title');

    // прознак редактирования тикета
    this.ticketModal.setAttribute('data-index', index);

    // прочитаем полную информацию о тикете
    const ticketFull = await this.getTicketDescription(ticket);

    title.textContent = 'Изменить тикет';
    // меняем содержимое формы
    const nameElem = this.ticketModal.querySelector('.form-input-name');
    const descriptionElem = this.ticketModal.querySelector('.form-input-description');

    nameElem.value = ticketFull.name;
    descriptionElem.value = ticketFull.description;

    // отображаем форму
    this.ticketModal.style.display = 'block';
    this.modalBackground.style.display = 'block';

    // форсируем изменение поля textarea по содержимому
    const event = new Event('input');
    descriptionElem.dispatchEvent(event);
  }

  openDeleteModal(index) {
    this.indexSelectedTicket = index;
    this.deleteModal.style.display = 'block';
    this.modalBackground.style.display = 'block';
  }

  async confirmDeleteTicket() {
    const index = this.indexSelectedTicket;
    const { id } = this.tickets[index];
    try {
      const response = await fetch(`${this.url}/?method=deleteTicket&id=${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete ticket');
      }
      this.tickets.splice(index, 1);
      this.displayTickets();
    } catch (error) {
      console.error(error);
    }
    this.closeModals();
  }

  closeModals() {
    this.deleteModal.style.display = 'none';
    this.ticketModal.style.display = 'none';
    this.modalBackground.style.display = 'none';
    this.indexSelectedTicket = undefined;

    this.ticketModal.removeAttribute('data-index');
  }

  async postTicket(formData) {
    try {
      const response = await fetch(`${this.url}/?method=createTicket`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        throw new Error('Failed to create ticket');
      }
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  async patchTicket(formData, index) {
    const { id } = this.tickets[index];

    try {
      const response = await fetch(`${this.url}/?method=editTicket&id=${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        throw new Error('Failed to create ticket');
      }
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  #createFormTicket() {
    // Создаем элементы формы
    const form = document.createElement('form');
    form.classList.add('form-ticket');
    form.setAttribute('onsubmit', 'event.preventDefault()');

    const titleLabel = document.createElement('label');
    titleLabel.classList.add('form-title');
    titleLabel.textContent = '';

    const labelName = document.createElement('label');
    labelName.textContent = 'Краткое описание';

    const nameInput = document.createElement('input');
    nameInput.classList.add('form-input-name');

    const labelDescription = document.createElement('label');
    labelDescription.textContent = 'Подробное описание';

    const descriptionInput = document.createElement('textarea');
    descriptionInput.classList.add('form-input-description');
    function autoResizeTextArea() {
      this.style.height = 'auto';
      this.style.height = `${this.scrollHeight} px`;
    }
    descriptionInput.addEventListener('input', autoResizeTextArea, false);

    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add('button-container');

    const cancelButton = document.createElement('button');
    cancelButton.classList.add('cancelButton');

    const okButton = document.createElement('button');
    okButton.classList.add('confirmButton');

    // Настройка элементов формы
    nameInput.type = 'text';
    nameInput.setAttribute('required', true);
    cancelButton.textContent = 'Отмена';
    okButton.textContent = 'Ок';

    // Добавляем элементы формы в контейнер
    form.appendChild(titleLabel);
    form.appendChild(labelName);
    form.appendChild(nameInput);
    form.appendChild(labelDescription);
    form.appendChild(descriptionInput);
    form.appendChild(buttonContainer);
    buttonContainer.appendChild(cancelButton);
    buttonContainer.appendChild(okButton);

    // Добавляем обработчики событий для кнопок
    cancelButton.addEventListener('click', () => {
      this.closeModals();
    });

    okButton.addEventListener('click', async (e) => {
      e.preventDefault();
      if (form.checkValidity()) {
        const formData = {
          name: nameInput.value,
          description: descriptionInput.value,
        };

        // определим по index это изменение или создание нового тикета
        let res;
        const index = this.ticketModal.getAttribute('data-index');
        if (index) {
          res = await this.patchTicket(formData, index);
        } else {
          res = await this.postTicket(formData);
        }

        // считаем и отобразим обновленные тикеты
        if (res) {
          this.loadTickets();
        }

        this.closeModals();
      }
    });

    // Добавляем форму в контейнер модального окна
    this.ticketModal.appendChild(form);
  }
}
