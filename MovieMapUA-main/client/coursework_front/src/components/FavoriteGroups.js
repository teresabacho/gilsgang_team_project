import React, { useState } from 'react';
import axios from 'axios';
import deleteIcon from '../images/delete.png';
import editIcon from '../images/edit.png';

const FavoriteGroups = ({
                                   groups,
                                   onGroupsUpdate,
                                   favoritesByType,
                                   selectedItems,
                                   setSelectedItems,
                                   onMessage,
                                   onError
                               }) => {
    const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
    const [isEditGroupModalOpen, setIsEditGroupModalOpen] = useState(false);
    const [isViewGroupModalOpen, setIsViewGroupModalOpen] = useState(false);
    const [currentGroup, setCurrentGroup] = useState(null);
    const [newGroupName, setNewGroupName] = useState('');
    const [editingGroupName, setEditingGroupName] = useState('');
    const [editingGroupItems, setEditingGroupItems] = useState([]);


    const getTypeInUkrainian = (type) => {
        const typeMap = {
            'movie': 'фільм',
            'hotel': 'готель',
            'route': 'маршрут',
            'attraction': 'екскурсія'
        };
        return typeMap[type] || type;
    };

    const getAllFavoriteItems = () => {
        const allItems = [];
        Object.values(favoritesByType).forEach(typeItems => {
            allItems.push(...typeItems);
        });
        return allItems;
    };

    const handleCreateGroup = async () => {
        if (!newGroupName.trim()) {
            onError("Введіть назву групи");
            return;
        }

        if (selectedItems.length === 0) {
            onError("Виберіть елементи для групи");
            return;
        }

        try {
            const response = await axios.post('/api/user/favorite-groups', {
                name: newGroupName,
                itemIds: selectedItems
            }, { withCredentials: true });

            if (response.status === 201) {
                onMessage("Група успішно створена");
                setNewGroupName('');
                setSelectedItems([]);
                setIsCreateGroupModalOpen(false);
                onGroupsUpdate();
                onError(null);
            }
        } catch (error) {
            console.error("Error creating group:", error);
            onError(error.response?.data?.error || "Помилка створення групи");
        }
    };

    const handleUpdateGroup = async () => {
        if (!editingGroupName.trim()) {
            onError("Введіть назву групи");
            return;
        }

        if (editingGroupItems.length === 0) {
            onError("Виберіть елементи для групи");
            return;
        }

        try {
            const response = await axios.put(`/api/user/favorite-groups/${currentGroup._id}`, {
                name: editingGroupName,
                itemIds: editingGroupItems
            }, { withCredentials: true });

            if (response.status === 200) {
                onMessage("Група успішно оновлена");
                closeEditModal();
                onGroupsUpdate();
                onError(null);
            }
        } catch (error) {
            console.error("Error updating group:", error);
            onError(error.response?.data?.error || "Помилка оновлення групи");
        }
    };

    const handleDeleteGroup = async (groupId) => {
        if (!window.confirm("Ви впевнені, що хочете видалити цю групу?")) {
            return;
        }

        try {
            const response = await axios.delete(`/api/user/favorite-groups/${groupId}`, { withCredentials: true });
            if (response.status === 200) {
                onMessage("Група успішно видалена");
                onGroupsUpdate();
                onError(null);
            }
        } catch (error) {
            console.error("Error deleting group:", error);
            onError("Помилка видалення групи");
        }
    };

    const openCreateGroupModal = () => {
        setIsCreateGroupModalOpen(true);
        onError(null);
    };

    const closeCreateModal = () => {
        setIsCreateGroupModalOpen(false);
        setNewGroupName('');
        onError(null);
    };

    const openEditGroupModal = (group) => {
        setCurrentGroup(group);
        setEditingGroupName(group.name);
        setEditingGroupItems(group.items.map(item => item.favoriteId || item._id));
        setIsEditGroupModalOpen(true);
        onError(null);
    };

    const closeEditModal = () => {
        setIsEditGroupModalOpen(false);
        setCurrentGroup(null);
        setEditingGroupName('');
        setEditingGroupItems([]);
        onError(null);
    };

    const openViewGroupModal = (group) => {
        setCurrentGroup(group);
        setIsViewGroupModalOpen(true);
    };

    const closeViewModal = () => {
        setIsViewGroupModalOpen(false);
        setCurrentGroup(null);
    };

    const handleEditGroupItemSelect = (itemId) => {
        setEditingGroupItems(prev =>
            prev.includes(itemId)
                ? prev.filter(id => id !== itemId)
                : [...prev, itemId]
        );
    };

    const renderFavoriteItemForEdit = (item) => {
        const favoriteId = item.favoriteId || item._id;
        const isSelected = editingGroupItems.includes(favoriteId);

        return (
            <div key={favoriteId} className={`favorite-item ${isSelected ? 'selected' : ''}`}>
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleEditGroupItemSelect(favoriteId)}
                    className="item-checkbox"
                />
                <div className="item-preview">
                    <span className="item-type">{getTypeInUkrainian(item.type)}</span>
                    <span className="item-name">{item.name || item.title}</span>
                </div>
            </div>
        );
    };

    const renderFavoriteItemForView = (item) => {

        return (
            <div key={item.favoriteId || item._id} className="favorite-item view-only">
                <div className="item-preview">
                    <span className="item-type">{getTypeInUkrainian(item.type)}</span>
                    <span className="item-name">{item.name || item.title}</span>
                </div>
            </div>
        );
    };

    return (
        <>
            <div className="favorites-actions">
                <button
                    className="button"
                    onClick={openCreateGroupModal}
                    disabled={selectedItems.length === 0}
                >
                    Створити групу ({selectedItems.length})
                </button>
                <button
                    className="button secondary"
                    onClick={() => setSelectedItems([])}
                    disabled={selectedItems.length === 0}
                >
                    Скасувати вибір
                </button>
            </div>

            {groups.length > 0 && (
                <div className="groups-section">
                    <div className="routing-header">
                        <h3>Мої групи</h3>
                    </div>
                    <div className="groups-container">
                        {groups.map(group => (
                            <div key={group._id} className="group-card">
                                <div className="group-header">
                                    <h4
                                        onClick={() => openViewGroupModal(group)}
                                        style={{ cursor: 'pointer' }}
                                        title="Натисніть, щоб переглянути елементи групи"
                                    >
                                        {group.name}
                                    </h4>
                                    <div className="group-actions">
                                        <button
                                            className="edit-btn"
                                            onClick={() => openEditGroupModal(group)}
                                            title="Редагувати групу"
                                        >
                                            <img src={editIcon} alt="Редагувати" />
                                        </button>
                                        <button
                                            className="delete-btn"
                                            onClick={() => handleDeleteGroup(group._id)}
                                            title="Видалити групу"
                                        >
                                            <img src={deleteIcon} alt="Видалити" />
                                        </button>
                                    </div>
                                </div>
                                <div className="group-items-count">
                                    <p>Елементів в групі: {group.items.length}</p>
                                </div>
                                <div className="group-items-preview">
                                    {group.items.slice(0, 3).map((item, index) => (
                                        <div key={index} className="group-item-preview">
                                            <span className="item-type">{getTypeInUkrainian(item.type)}</span>
                                            <span className="item-name">{item.name || item.title}</span>
                                        </div>
                                    ))}
                                    {group.items.length > 3 && (
                                        <div className="group-item-preview">
                                            <span className="more-items">+{group.items.length - 3} ще</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {isCreateGroupModalOpen && (
                <div className="modal">
                    <div className="modal-content">
                        <h2>Створити нову групу</h2>
                        <label>
                            Назва групи:
                            <input
                                type="text"
                                value={newGroupName}
                                onChange={(e) => setNewGroupName(e.target.value)}
                                placeholder="Введіть назву групи"
                                style={{ width: "100%", padding: "8px", margin: "8px 0" }}
                            />
                        </label>
                        <div className="selected-items-preview">
                            <p>Вибрані елементи ({selectedItems.length}):</p>
                            <div className="selected-items-list">
                                {selectedItems.map(itemId => {
                                    let foundItem = null;
                                    Object.values(favoritesByType).forEach(typeItems => {
                                        const item = typeItems.find(item => (item.favoriteId || item._id) === itemId);
                                        if (item) foundItem = item;
                                    });

                                    return foundItem ? (
                                        <span key={itemId} className="selected-item-tag">
                                            {getTypeInUkrainian(foundItem.type)}: {foundItem.name || foundItem.title}
                                        </span>
                                    ) : null;
                                })}
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button className="button" onClick={handleCreateGroup}>
                                Створити групу
                            </button>
                            <button className="button secondary" onClick={closeCreateModal}>
                                Скасувати
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isEditGroupModalOpen && currentGroup && (
                <div className="modal">
                    <div className="modal-content large">
                        <h2>Редагувати групу: {currentGroup.name}</h2>
                        <label>
                            Назва групи:
                            <input
                                type="text"
                                value={editingGroupName}
                                onChange={(e) => setEditingGroupName(e.target.value)}
                                placeholder="Введіть назву групи"
                                style={{ width: "100%", padding: "8px", margin: "8px 0" }}
                            />
                        </label>

                        <div className="edit-group-items">
                            <h4>Виберіть елементи для групи:</h4>
                            <p>Обрано: {editingGroupItems.length} елементів</p>
                            <div className="favorites-grid edit-mode">
                                {getAllFavoriteItems().map(item => renderFavoriteItemForEdit(item))}
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button className="button" onClick={handleUpdateGroup}>
                                Зберегти зміни
                            </button>
                            <button className="button secondary" onClick={closeEditModal}>
                                Скасувати
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isViewGroupModalOpen && currentGroup && (
                <div className="modal">
                    <div className="modal-content large">
                        <div className="modal-header">
                            <h2>Група: {currentGroup.name}</h2>
                            <button className="close-btn" onClick={closeViewModal}>
                                ✕
                            </button>
                        </div>

                        <div className="group-view-content">
                            <p>Елементів в групі: {currentGroup.items.length}</p>
                            <div className="favorites-grid view-mode">
                                {currentGroup.items.map(item => renderFavoriteItemForView(item))}
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button
                                className="button"
                                onClick={() => {
                                    closeViewModal();
                                    openEditGroupModal(currentGroup);
                                }}
                            >
                                Редагувати групу
                            </button>
                            <button className="button secondary" onClick={closeViewModal}>
                                Закрити
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default FavoriteGroups;