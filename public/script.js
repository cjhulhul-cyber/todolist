// TaskCafe - Todo App JavaScript

class TodoApp {
    constructor() {
        this.todos = [];
        this.currentFilter = 'all';
        this.currentPriorityFilter = 'all';
        this.currentSort = 'created';
        this.searchQuery = '';
        this.editingTodoId = null;
        
        this.initializeElements();
        this.attachEventListeners();
        this.loadTodos();
        this.loadTheme();
    }

    initializeElements() {
        // Input elements
        this.todoInput = document.getElementById('todoInput');
        this.prioritySelect = document.getElementById('prioritySelect');
        this.addBtn = document.getElementById('addTodoBtn');
        this.searchInput = document.getElementById('searchInput');
        this.sortSelect = document.getElementById('sortSelect');

        // Filter elements
        this.filterBtns = document.querySelectorAll('.filter-btn');
        this.priorityFilterBtns = document.querySelectorAll('.priority-filter-btn');

        // Display elements
        this.todosList = document.getElementById('todosList');
        this.emptyState = document.getElementById('emptyState');
        this.totalCount = document.getElementById('totalCount');
        this.pendingCount = document.getElementById('pendingCount');

        // Theme toggle
        this.themeToggle = document.getElementById('themeToggle');

        // Modal elements
        this.editModal = document.getElementById('editModal');
        this.editInput = document.getElementById('editInput');
        this.editPrioritySelect = document.getElementById('editPrioritySelect');
        this.modalClose = document.getElementById('modalClose');
        this.cancelEdit = document.getElementById('cancelEdit');
        this.saveEdit = document.getElementById('saveEdit');

        // Notification
        this.notification = document.getElementById('notification');
        this.notificationText = document.getElementById('notificationText');
    }

    attachEventListeners() {
        // Add todo
        this.addBtn.addEventListener('click', () => this.addTodo());
        this.todoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTodo();
        });

        // Search
        this.searchInput.addEventListener('input', (e) => {
            this.searchQuery = e.target.value.toLowerCase();
            this.renderTodos();
        });

        // Filters
        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });

        this.priorityFilterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setPriorityFilter(e.target.dataset.priority);
            });
        });

        // Sort
        this.sortSelect.addEventListener('change', (e) => {
            this.currentSort = e.target.value;
            this.renderTodos();
        });

        // Theme toggle
        this.themeToggle.addEventListener('click', () => this.toggleTheme());

        // Modal
        this.modalClose.addEventListener('click', () => this.closeModal());
        this.cancelEdit.addEventListener('click', () => this.closeModal());
        this.saveEdit.addEventListener('click', () => this.saveEditedTodo());
        
        // Close modal on outside click
        this.editModal.addEventListener('click', (e) => {
            if (e.target === this.editModal) this.closeModal();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'n') {
                e.preventDefault();
                this.todoInput.focus();
            }
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }

    async loadTodos() {
        try {
            const response = await fetch('/api/todos');
            if (response.ok) {
                this.todos = await response.json();
                this.renderTodos();
            } else {
                this.showNotification('할 일을 불러오는데 실패했습니다.', 'error');
            }
        } catch (error) {
            console.error('Error loading todos:', error);
            this.showNotification('할 일을 불러오는데 실패했습니다.', 'error');
        }
    }

    async addTodo() {
        const text = this.todoInput.value.trim();
        const priority = this.prioritySelect.value;

        if (!text) {
            this.showNotification('할 일을 입력해주세요.', 'error');
            return;
        }

        try {
            const response = await fetch('/api/todos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text, priority }),
            });

            if (response.ok) {
                const newTodo = await response.json();
                this.todos.push(newTodo);
                this.todoInput.value = '';
                this.prioritySelect.value = 'medium';
                this.renderTodos();
                this.showNotification('할 일이 추가되었습니다.');
            } else {
                const error = await response.json();
                this.showNotification(error.error || '할 일 추가에 실패했습니다.', 'error');
            }
        } catch (error) {
            console.error('Error adding todo:', error);
            this.showNotification('할 일 추가에 실패했습니다.', 'error');
        }
    }

    async toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (!todo) return;

        try {
            const response = await fetch(`/api/todos/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ completed: !todo.completed }),
            });

            if (response.ok) {
                const updatedTodo = await response.json();
                const index = this.todos.findIndex(t => t.id === id);
                this.todos[index] = updatedTodo;
                this.renderTodos();
                this.showNotification(
                    updatedTodo.completed ? '할 일을 완료했습니다.' : '할 일을 미완료로 변경했습니다.'
                );
            } else {
                this.showNotification('할 일 상태 변경에 실패했습니다.', 'error');
            }
        } catch (error) {
            console.error('Error toggling todo:', error);
            this.showNotification('할 일 상태 변경에 실패했습니다.', 'error');
        }
    }

    async deleteTodo(id) {
        if (!confirm('정말로 이 할 일을 삭제하시겠습니까?')) return;

        try {
            const response = await fetch(`/api/todos/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                this.todos = this.todos.filter(t => t.id !== id);
                this.renderTodos();
                this.showNotification('할 일이 삭제되었습니다.');
            } else {
                this.showNotification('할 일 삭제에 실패했습니다.', 'error');
            }
        } catch (error) {
            console.error('Error deleting todo:', error);
            this.showNotification('할 일 삭제에 실패했습니다.', 'error');
        }
    }

    openEditModal(id) {
        const todo = this.todos.find(t => t.id === id);
        if (!todo) return;

        this.editingTodoId = id;
        this.editInput.value = todo.text;
        this.editPrioritySelect.value = todo.priority;
        this.editModal.classList.add('show');
        this.editInput.focus();
    }

    closeModal() {
        this.editModal.classList.remove('show');
        this.editingTodoId = null;
    }

    async saveEditedTodo() {
        const text = this.editInput.value.trim();
        const priority = this.editPrioritySelect.value;

        if (!text) {
            this.showNotification('할 일을 입력해주세요.', 'error');
            return;
        }

        try {
            const response = await fetch(`/api/todos/${this.editingTodoId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text, priority }),
            });

            if (response.ok) {
                const updatedTodo = await response.json();
                const index = this.todos.findIndex(t => t.id === this.editingTodoId);
                this.todos[index] = updatedTodo;
                this.renderTodos();
                this.closeModal();
                this.showNotification('할 일이 수정되었습니다.');
            } else {
                this.showNotification('할 일 수정에 실패했습니다.', 'error');
            }
        } catch (error) {
            console.error('Error updating todo:', error);
            this.showNotification('할 일 수정에 실패했습니다.', 'error');
        }
    }

    setFilter(filter) {
        this.currentFilter = filter;
        this.filterBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        this.renderTodos();
    }

    setPriorityFilter(priority) {
        this.currentPriorityFilter = priority;
        this.priorityFilterBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.priority === priority);
        });
        this.renderTodos();
    }

    getFilteredTodos() {
        let filtered = [...this.todos];

        // Status filter
        if (this.currentFilter === 'completed') {
            filtered = filtered.filter(todo => todo.completed);
        } else if (this.currentFilter === 'pending') {
            filtered = filtered.filter(todo => !todo.completed);
        }

        // Priority filter
        if (this.currentPriorityFilter !== 'all') {
            filtered = filtered.filter(todo => todo.priority === this.currentPriorityFilter);
        }

        // Search filter
        if (this.searchQuery) {
            filtered = filtered.filter(todo => 
                todo.text.toLowerCase().includes(this.searchQuery)
            );
        }

        return filtered;
    }

    getSortedTodos(todos) {
        const sorted = [...todos];

        switch (this.currentSort) {
            case 'priority':
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                sorted.sort((a, b) => {
                    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
                    if (priorityDiff !== 0) return priorityDiff;
                    return new Date(b.createdAt) - new Date(a.createdAt);
                });
                break;
            case 'alphabetical':
                sorted.sort((a, b) => a.text.localeCompare(b.text, 'ko'));
                break;
            case 'created':
            default:
                sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
        }

        return sorted;
    }

    renderTodos() {
        const filteredTodos = this.getFilteredTodos();
        const sortedTodos = this.getSortedTodos(filteredTodos);

        // Update counts
        this.totalCount.textContent = this.todos.length;
        this.pendingCount.textContent = this.todos.filter(t => !t.completed).length;

        // Show/hide empty state
        if (sortedTodos.length === 0) {
            this.todosList.style.display = 'none';
            this.emptyState.style.display = 'block';
            
            if (this.todos.length === 0) {
                this.emptyState.innerHTML = `
                    <i class="fas fa-clipboard-list"></i>
                    <h3>할 일이 없습니다</h3>
                    <p>새로운 할 일을 추가해보세요!</p>
                `;
            } else {
                this.emptyState.innerHTML = `
                    <i class="fas fa-search"></i>
                    <h3>검색 결과가 없습니다</h3>
                    <p>다른 검색어나 필터를 시도해보세요.</p>
                `;
            }
            return;
        }

        this.emptyState.style.display = 'none';
        this.todosList.style.display = 'flex';

        // Render todos
        this.todosList.innerHTML = sortedTodos.map(todo => this.createTodoHTML(todo)).join('');

        // Attach event listeners to todo items
        this.attachTodoEventListeners();
    }

    createTodoHTML(todo) {
        const priorityColors = {
            high: 'var(--accent-red)',
            medium: 'var(--accent-yellow)',
            low: 'var(--accent-green)'
        };

        const priorityLabels = {
            high: '높음',
            medium: '보통',
            low: '낮음'
        };

        return `
            <div class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
                <div class="todo-checkbox ${todo.completed ? 'checked' : ''}" data-action="toggle">
                    ${todo.completed ? '<i class="fas fa-check"></i>' : ''}
                </div>
                <div class="todo-content">
                    <div class="todo-text">${this.escapeHtml(todo.text)}</div>
                    <div class="todo-priority">
                        <span class="priority-indicator ${todo.priority}" style="background: ${priorityColors[todo.priority]}"></span>
                        ${priorityLabels[todo.priority]}
                    </div>
                </div>
                <div class="todo-actions">
                    <button class="action-btn edit" data-action="edit">
                        <i class="fas fa-edit"></i>
                        수정
                    </button>
                    <button class="action-btn delete" data-action="delete">
                        <i class="fas fa-trash"></i>
                        삭제
                    </button>
                </div>
            </div>
        `;
    }

    attachTodoEventListeners() {
        this.todosList.addEventListener('click', (e) => {
            const todoItem = e.target.closest('.todo-item');
            if (!todoItem) return;

            const todoId = todoItem.dataset.id;
            const action = e.target.closest('[data-action]')?.dataset.action;

            switch (action) {
                case 'toggle':
                    this.toggleTodo(todoId);
                    break;
                case 'edit':
                    this.openEditModal(todoId);
                    break;
                case 'delete':
                    this.deleteTodo(todoId);
                    break;
            }
        });
    }

    toggleTheme() {
        const body = document.body;
        const isLight = body.classList.toggle('light-theme');
        
        // Update theme toggle icon
        const icon = this.themeToggle.querySelector('i');
        icon.className = isLight ? 'fas fa-sun' : 'fas fa-moon';
        
        // Save theme preference
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
        
        this.showNotification(`${isLight ? '라이트' : '다크'} 테마로 변경되었습니다.`);
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'light') {
            document.body.classList.add('light-theme');
            this.themeToggle.querySelector('i').className = 'fas fa-sun';
        }
    }

    showNotification(message, type = 'success') {
        this.notificationText.textContent = message;
        this.notification.className = `notification ${type}`;
        this.notification.classList.add('show');

        setTimeout(() => {
            this.notification.classList.remove('show');
        }, 3000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TodoApp();
});

// Service Worker registration for PWA (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}
