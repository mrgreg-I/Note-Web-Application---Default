import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api/user';
const TX_HISTORY_BASE_URL = 'http://localhost:8080/api/transaction-history';

const authHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem('authToken')}`,
  },
});

export const createUser = (userData) => axios.post(`${API_BASE_URL}/create`, userData);
export const getUserById = (userId) => axios.get(`${API_BASE_URL}/read/${userId}`, authHeaders());
export const updateUser = (id, userData) => axios.put(`${API_BASE_URL}/update?id=${id}`, userData, authHeaders());
export const deleteUser = (id) => axios.delete(`${API_BASE_URL}/delete/${id}`, authHeaders());

export const getToDoLists = () => axios.get(`${API_BASE_URL}/allT`, authHeaders());
export const createToDoList = async (toDoData) => axios.post(`${API_BASE_URL}/createT`, toDoData, authHeaders());
export const updateToDoList = (id, updatedList) => axios.put(`${API_BASE_URL}/updateT`, updatedList, { ...authHeaders(), params: { id } });
export const deleteToDoList = (id) => axios.delete(`${API_BASE_URL}/deleteT/${id}`, authHeaders());
export const getToDosByUserId = async (userId) => axios.get(`${API_BASE_URL}/todos`, { ...authHeaders(), params: { userId } });
export const viewToDoList = () => axios.put(`${API_BASE_URL}/allT`, {}, authHeaders());

// Transaction history (wallet-based) helpers
export const getTransactionHistoryByWallet = (walletAddress) =>
  axios.get(`${TX_HISTORY_BASE_URL}/wallet/${encodeURIComponent(walletAddress)}`);
