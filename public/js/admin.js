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

    document.body.addEventListener('click', function(event) {
        const deleteButton = event.target.closest('.btn-deleteClass');
        if (deleteButton) {
            event.preventDefault();
            const classId = deleteButton.dataset.classId;
            deleteClass(classId);
        }
    });

    document.body.addEventListener('click', function(event) {
        const deleteButton = event.target.closest('.btn-deleteAdmin');
        if (deleteButton) {
            event.preventDefault();
            const adminId = deleteButton.dataset.adminId;
            deleteAdmin(adminId);
        }
    });

    document.body.addEventListener('click', function(event) {
        const deleteButton = event.target.closest('.btn-deletePupil');
        if (deleteButton) {
            event.preventDefault();
            const pupilId = deleteButton.dataset.pupilId;
            deletePupil(pupilId);
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

    // Функция удаления класса
    function deleteClass(classId) {
        if (confirm('Вы уверены, что хотите удалить этот класс?')) {
            fetch(`/admin/classes/${classId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const row = document.querySelector(`tr[data-class-id="${classId}"]`);
                    if (row) {
                        row.remove();
                        console.log('Class row removed');
                    } else {
                        console.error('Class not found');
                    }
                    alert('Класс успешно удален');
                } else {
                    alert(data.message || 'Ошибка при удалении класса');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Произошла ошибка при удалении класса');
            });
        }
    }

    // Функция удаления админа
    function deleteAdmin(adminId) {
        if (confirm('Вы уверены, что хотите удалить админа?')) {
            fetch(`/admin/${adminId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const row = document.querySelector(`tr[data-admin-id="${adminId}"]`);
                    if (row) {
                        row.remove();
                        console.log('Admin row removed');
                    } else {
                        console.error('Admin not found');
                    }
                    alert('Админ успешно удален');
                } else {
                    alert(data.message || 'Ошибка при удалении Админа');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Произошла ошибка при удалении Админа');
            });
        }
    }


    // Функция удаления ученика
    function deletePupil(pupilId) {
        if (confirm('Вы уверены, что хотите удалить этого ученика?')) {
            fetch(`/admin/pupils/${pupilId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const row = document.querySelector(`tr[data-pupil-id="${pupilId}"]`);
                    if (row) {
                        row.remove();
                        console.log('Pupil row removed');
                    } else {
                        console.error('Pupil not found');
                    }
                    alert('Ученик успешно удален');
                } else {
                    alert(data.message || 'Ошибка при удалении ученика');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Произошла ошибка при удалении ученика');
            });
        }
    }
    // Обработка формы редактирования школы
    

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