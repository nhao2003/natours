
import axios from 'axios';
import { showAlert } from './alerts';

export const login = async (email, password) => {
    console.log('login function called');
    try {
        const res = await axios({
            method: 'POST',
            url: '/api/v1/users/login',
            data: { email, password }
        });
        if (res.data.status === 'success') {
            showAlert('success', 'Logged in successfully!');
            window.setTimeout(() => {
                location.assign('/');
            }, 1500);
        }
    } catch (err) {
        showAlert('error', err.message);
    }
};
export const logout = async () => {
    try {
        const res = await axios({
            method: 'GET',
            url: '/api/v1/users/logout'
        });
        if (res.data.status === 'success') 
            // location is a property of window object in browser
            location.reload(true);
    } catch (err) {
        showAlert('error', 'Error logging out! Try again.');
    }
};


