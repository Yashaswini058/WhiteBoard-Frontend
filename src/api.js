import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

export const userApi = {
    signup: async (userData) => {
        try {
        const response = await axios.post(`${API_BASE_URL}/user/signup`, userData);
        if (response.data.token) {
            localStorage.setItem('userToken', response.data.token);
            localStorage.setItem('userData', JSON.stringify(response.data.user));
        }
        return response.data;
        } catch (error) {
        throw error.response?.data || error.message;
        }
    },

    login: async (userData) => {
        try {
        const response = await axios.post(`${API_BASE_URL}/user/signin`, userData);
        if (response.data.token) {
            localStorage.setItem('userToken', response.data.token);
            localStorage.setItem('userData', JSON.stringify(response.data.user));
        }
        return response.data;
        } catch (error) {
        throw error.response?.data || error.message;
        }
    },

    getBoards: async () => {
        try {
        const token = localStorage.getItem('userToken');
        const response = await axios.get(`${API_BASE_URL}/user/me`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data;
        } catch (error) {
        throw error.response?.data || error.message;
        }
    },

    createBoard: async (boardData) => {
        try {
        const token = localStorage.getItem('userToken');
        const response = await axios.post(`${API_BASE_URL}/board/create`, boardData, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data;
        } catch (error) {
        throw error.response?.data || error.message;
        }
    },

    loadBoard: async (boardId) => {
        try {
        const token = localStorage.getItem('userToken');
        const response = await axios.get(`${API_BASE_URL}/board/load/${boardId}`, {
            headers: {
                Authorization: `Bearer ${token}`
            },
        });
        return response.data;
        } catch (error) {
        throw error.response?.data || error.message;
        }
    },

    deleteBoard: async (boardId) => {
        try {
        const token = localStorage.getItem('userToken');
        const response = await axios.delete(`${API_BASE_URL}/board/delete/${boardId}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data;
        } catch (error) {
        throw error.response?.data || error.message;
        }
    },

    shareBoard: async (boardId, email) => {
        console.log('shareBoard called with:', { boardId, email });
        try {
            const token = localStorage.getItem('userToken');
            const response = await axios.put(`${API_BASE_URL}/board/share/${boardId}`, { email }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },
    removeBoardAccess: async (boardId, email) => {
        try {
            const token = localStorage.getItem('userToken');
            const response = await axios.put(`${API_BASE_URL}/board/unshare/${boardId}`,{email} ,{
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    updateBoard : async (boardId, boardData) => {
        try{
            const token = localStorage.getItem('userToken');
            const response = await axios.put(`${API_BASE_URL}/board/update/${boardId}`, boardData, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    }
}