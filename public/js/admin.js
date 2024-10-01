// public/js/admin.js

document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin script loaded');

    // Сортировка таблицы
    const table = document.querySelector('.schools-table');
    let headers;

    if (table) {
        headers = table.querySelectorAll('th.sortable');
        headers.forEach(header => {
            header.addEventListener('click', () => {
                const column = header.dataset.sort;
                const isAscending = header.classList.contains('asc');
                sortTable(column, !isAscending);
            });
        });
    }

    // Функция сортировки таблицы
    function sortTable(column, asc = true) {
        const tbody = table.querySelector('tbody');
        const rows = Array.from(tbody.querySelectorAll('tr'));
        
        const sortedRows = rows.sort((a, b) => {
            let aValue = a.querySelector(`td:nth-child(${getColumnIndex(column)})`).textContent.trim();
            let bValue = b.querySelector(`td:nth-child(${getColumnIndex(column)})`).textContent.trim();
            
            if (column === 'id' || column === 'studentCount' || column === 'teacherCount') {
                aValue = parseInt(aValue, 10);
                bValue = parseInt(bValue, 10);
                return asc ? aValue - bValue : bValue - aValue;
            } else {
                return asc ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
            }
        });

        // Очистка и заполнение tbody
        while (tbody.firstChild) {
            tbody.removeChild(tbody.firstChild);
        }
        sortedRows.forEach(row => tbody.appendChild(row));

        // Обновление иконок сортировки
        headers.forEach(h => {
            h.classList.remove('asc', 'desc');
        });
        const activeHeader = table.querySelector(`th[data-sort="${column}"]`);
        activeHeader.classList.toggle('asc', asc);
        activeHeader.classList.toggle('desc', !asc);
    }

    // Вспомогательная функция для получения индекса колонки
    function getColumnIndex(column) {
        return Array.from(headers).findIndex(h => h.dataset.sort === column) + 1;
    }

    // Обработка удаления школы
    document.body.addEventListener('click', function(event) {
        const deleteButton = event.target.closest('.btn-delete');
        if (deleteButton) {
            event.preventDefault();
            const schoolId = deleteButton.dataset.schoolId;
            deleteSchool(schoolId);
        }
    });

    // Функция удаления школы
    function deleteSchool(schoolId) {
        if (confirm('Вы уверены, что хотите удалить эту школу?')) {
            fetch(`/admin/schools/${schoolId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const row = document.querySelector(`tr[data-school-id="${schoolId}"]`);
                    if (row) {
                        row.remove();
                        console.log('School row removed');
                    } else {
                        console.error('Row not found');
                    }
                    alert('Школа успешно удалена');
                } else {
                    alert(data.message || 'Ошибка при удалении школы');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Произошла ошибка при удалении школы');
            });
        }
    }

    // Обработка формы редактирования школы
    const editForm = document.querySelector('.edit-school-form');
    if (editForm) {
        editForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const formData = new FormData(this);
            const schoolId = this.dataset.schoolId;

            fetch(`/admin/schools/${schoolId}`, {
                method: 'PUT',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Школа успешно обновлена');
                    window.location.href = '/admin/schools';
                } else {
                    alert(data.message || 'Ошибка при обновлении школы');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Произошла ошибка при обновлении школы');
            });
        });
    }

    function updatePagination() {
        const paginationContainer = document.querySelector('.pagination');
        if (paginationContainer) {
            const currentPage = parseInt(paginationContainer.dataset.currentPage) || 1;
            const totalPages = parseInt(paginationContainer.dataset.totalPages) || 1;
            
            let paginationHTML = '';
            
            if (currentPage > 1) {
                paginationHTML += `<a href="?page=${currentPage - 1}" class="btn btn-primary">Предыдущая</a>`;
            }
            
            paginationHTML += `<span class="page-info">Страница ${currentPage} из ${totalPages}</span>`;
            
            if (currentPage < totalPages) {
                paginationHTML += `<a href="?page=${currentPage + 1}" class="btn btn-primary">Следующая</a>`;
            }
            
            paginationContainer.innerHTML = paginationHTML;
        }
    }

    // Вызов функции обновления пагинации при загрузке страницы
    updatePagination();

    // Дополнительные функции админ-панели могут быть добавлены здесь
});