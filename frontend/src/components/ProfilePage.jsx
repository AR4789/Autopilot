import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from './ThemeContext';

const validatePassword = (password) =>
  /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/.test(password);

const ProfilePage = () => {
  const [user, setUser] = useState({ name: '', username: '', email: '', phone: '' });
  const [editField, setEditField] = useState({ name: false, phone: false, password: false });
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [retypePassword, setRetypePassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const { darkMode } = useContext(ThemeContext);
  const BASE_URL = process.env.REACT_APP_API_URL;


  useEffect(() => {
    axios
      .get(`${BASE_URL}/api/user/me`, { withCredentials: true })
      .then((res) => setUser(res.data))
      .catch((err) => console.error(err));
  }, []);

  const handleSave = async () => {
    setError('');
    setSuccess('');

    if (editField.name && !user.name) return setError('Name cannot be empty.');
    if (editField.phone && !user.phone) return setError('Phone cannot be empty.');

    if (editField.password) {
      if (!validatePassword(newPassword)) {
        return setError(
          'Password must be at least 8 characters long and contain an uppercase letter, lowercase letter, number, and special character.'
        );
      }
      if (newPassword !== retypePassword) return setError('Passwords do not match.');
      if (!currentPassword) return setError('Please enter your current password.');
    }

    try {
      await axios.get(`${BASE_URL}/api/auth/status`, { withCredentials: true });

      await axios.put(
        `${BASE_URL}/api/user/update`,
        {
          name: editField.name ? user.name : undefined,
          phone: editField.phone ? user.phone : undefined,
          currentPassword: editField.password ? currentPassword : undefined,
          newPassword: editField.password ? newPassword : undefined,
        },
        { withCredentials: true }
      );

      setSuccess('Profile updated successfully!');
      setEditField({ name: false, phone: false, password: false });
      setCurrentPassword('');
      setNewPassword('');
      setRetypePassword('');
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Session expired. Please login again.');
        navigate('/login');
      } else {
        setError(err.response?.data?.message || 'Update failed.');
      }
    }
  };

  const cancelEditing = () => {
    setEditField({ name: false, phone: false, password: false });
    setCurrentPassword('');
    setNewPassword('');
    setRetypePassword('');
    setError('');
    setSuccess('');
  };

  return (
    <div
      className={`min-h-screen py-10 px-4 transition-colors duration-500 ${
        darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'
      }`}
    >
      <div
        className={`max-w-2xl mx-auto rounded-2xl shadow-lg p-8 transition-all duration-500 ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        }`}
      >
        <h2 className="text-2xl font-bold mb-6">My Account</h2>

        {/* Name */}
        <ProfileField
          label="Name"
          value={user.name}
          isEditable={editField.name}
          onEdit={() => setEditField({ ...editField, name: true })}
          onChange={(e) => setUser({ ...user, name: e.target.value })}
        />

        {/* Phone */}
        <ProfileField
          label="Phone"
          value={user.phone}
          isEditable={editField.phone}
          onEdit={() => setEditField({ ...editField, phone: true })}
          onChange={(e) => setUser({ ...user, phone: e.target.value })}
        />

        {/* Username */}
        <ReadOnlyField label="Username" value={user.username} />

        {/* Email */}
        <ReadOnlyField label="Email" value={user.email} />

        {/* Password */}
        <div className="mb-4">
          <label className="block font-medium mb-1">Password</label>
          <div className="flex gap-2">
            <input
              type="password"
              value="********"
              readOnly
              className={`w-full px-3 py-2 rounded border ${
                darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100'
              }`}
            />
            {!editField.password && (
              <button
                onClick={() => setEditField({ ...editField, password: true })}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
              >
                Edit
              </button>
            )}
          </div>
        </div>

        {/* Password Fields */}
        {editField.password && (
          <>
            <EditablePasswordField
              label="Current Password"
              value={currentPassword}
              onChange={setCurrentPassword}
              darkMode={darkMode}
            />
            <EditablePasswordField
              label="New Password"
              value={newPassword}
              onChange={setNewPassword}
              darkMode={darkMode}
            />
            <EditablePasswordField
              label="Retype New Password"
              value={retypePassword}
              onChange={setRetypePassword}
              darkMode={darkMode}
            />
          </>
        )}

        {/* Feedback */}
        {error && <div className="text-red-500 mb-3">{error}</div>}
        {success && <div className="text-green-500 mb-3">{success}</div>}

        {/* Action Buttons */}
        {(editField.name || editField.phone || editField.password) && (
          <div className="flex gap-4 mt-4">
            <button
              onClick={handleSave}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
            >
              Save Changes
            </button>
            <button
              onClick={cancelEditing}
              className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;

// Reusable Field Components
const ProfileField = ({ label, value, isEditable, onEdit, onChange }) => {
  const { darkMode } = useContext(ThemeContext);

  return (
    <div className="mb-4">
      <label className="block font-medium mb-1">{label}</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          readOnly={!isEditable}
          onChange={onChange}
          className={`w-full px-3 py-2 rounded border transition ${
            darkMode
              ? 'bg-gray-800 text-white border-gray-600 placeholder-gray-400'
              : 'bg-white text-black border-gray-300'
          }`}
        />
        {!isEditable && (
          <button onClick={onEdit} className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded">
            Edit
          </button>
        )}
      </div>
    </div>
  );
};


const ReadOnlyField = ({ label, value }) => {
  const { darkMode } = useContext(ThemeContext);

  return (
    <div className="mb-4">
      <label className="block font-medium mb-1">{label}</label>
      <input
        type="text"
        value={value}
        readOnly
        className={`w-full px-3 py-2 rounded border ${
          darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-gray-100 text-black border-gray-300'
        }`}
      />
    </div>
  );
};


const EditablePasswordField = ({ label, value, onChange, darkMode }) => (
  <div className="mb-4">
    <label className="block font-medium mb-1">{label}</label>
    <input
      type="password"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full px-3 py-2 rounded border ${
        darkMode
          ? 'bg-gray-800 text-white border-gray-600 placeholder-gray-400'
          : 'bg-white text-black border-gray-300'
      }`}
    />
  </div>
);

