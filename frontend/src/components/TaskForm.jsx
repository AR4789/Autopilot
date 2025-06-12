import React, { useState, useEffect } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { toast } from "react-toastify";


const TaskForm = ({ task, index, onChange, onRemove, onErrorChange, showErrors }) => {
  const [errors, setErrors] = useState({});
  const BASE_URL = process.env.REACT_APP_API_URL;

  useEffect(() => {
    validateFields();
  }, [task]);

  useEffect(() => {
    onErrorChange(index, errors);
  }, [errors]);

  const validateFields = () => {
    const newErrors = {};
    for (const [key, value] of Object.entries(task.config)) {
      if (typeof value === "string" && value.trim() === "") {
        newErrors[key] = `Required`;
      }
      if (
        typeof value === "object" &&
        task.type === "api" &&
        (key === "headers" || key === "body") &&
        Object.keys(value).length === 0 &&
        task.config.method === "POST"
      ) {
        newErrors[key] = "Cannot be empty JSON";
      }
    }
    setErrors(newErrors);
  };

  const handleInputChange = (e) => {
  const { name, value } = e.target;

  let newValue = value;
  if (["headers", "body"].includes(name)) {
    try {
      newValue = JSON.parse(value);
      setErrors((prev) => ({ ...prev, [name]: undefined })); // Clear error if valid
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        [name]: "Invalid JSON format", // Set error for invalid JSON
      }));
      return;
    }
  }

  const newTask = {
    ...task,
    config: {
      ...task.config,
      [name]: newValue,
    },
  };

  onChange(index, newTask);
};

  const handleTypeChange = (e) => {
    const newType = e.target.value;
    let defaultConfig = {};

    if (newType === "api") {
      defaultConfig = { url: "", method: "GET", headers: {}, body: {} };
    } else if (newType === "shell") {
      defaultConfig = {
        serverIp: "",
        serverUsername: "",
        shellScriptFilepath: "",
        privateKeyPemFilepath: "",
        pemFilePassword: "",
      };
    } else if (newType === "db") {
      defaultConfig = {
        dbUrl: "",
        dbUsername: "",
        dbPassword: "",
        sqlFilepath: "",
      };
    }

    onChange(index, { type: newType, config: defaultConfig });
  };

  function formatLabel(text) {
    return text
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase());
  }

const renderInput = (name, value) => {
  const isFileField = name.toLowerCase().includes("path");
  const isJSONField = ["headers", "body"].includes(name);

  const getAllowedExtension = (fieldName) => {
    if (fieldName === "privateKeyPemFilepath") return ".pem";
    if (fieldName === "shellScriptFilepath") return ".sh";
    if (fieldName === "sqlFilepath") return ".sql";
    return null;
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedExt = getAllowedExtension(name);
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();

    if (allowedExt && ext !== allowedExt) {
      setErrors((prev) => ({
        ...prev,
        [name]: `Only ${allowedExt} files are allowed.`,
      }));
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", ext === ".pem" ? "pem" : ext === ".sql" ? "sql" : "sh");

    try {
      const res = await fetch(`${BASE_URL}/api/auth/upload-file`, {
        method: "POST",
        body: formData,
      });

      const path = await res.text();
      if (res.ok) {
        const newTask = {
          ...task,
          config: {
            ...task.config,
            [name]: path,
          },
        };
        onChange(index, newTask);
      } else {
        console.error("Upload failed:", path);
      }
    } catch (err) {
      console.error("Upload error:", err);
    }
  };

  return (
    <div key={name}>
      <label className="text-black dark:text-white font-bold">
        {formatLabel(name)}:
      </label>

      {isFileField ? (
        <div className="flex items-center justify-between gap-2 mb-2">
          <input
            type="text"
            readOnly
            value={value || ""}
            className="flex-1 bg-gray-100 dark:bg-gray-800 text-black dark:text-white border border-gray-300 dark:border-gray-600 rounded px-2 py-1"
            placeholder="No file chosen"
          />
          <label className="relative inline-block cursor-pointer bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 transition-colors">
            Choose File
            <input
              type="file"
              name={name}
              accept={getAllowedExtension(name)}
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </label>
        </div>
      ) : isJSONField ? (
        <textarea
          name={name}
          placeholder={`Example: { "key": "value" }`}
             value={
              // Show empty string if value is empty string or empty object
              typeof value === "string"
                ? value === ""
                  ? ""
                  : value
                : Object.keys(value || {}).length === 0
                ? ""
                : JSON.stringify(value, null, 2)
            }
          onChange={(e) => {
            const inputVal = e.target.value;
            try {
              const parsed = JSON.parse(inputVal);
              setErrors((prev) => ({ ...prev, [name]: undefined }));
              const newTask = {
                ...task,
                config: {
                  ...task.config,
                  [name]: parsed,
                },
              };
              onChange(index, newTask);
            } catch {
              setErrors((prev) => ({
                ...prev,
                [name]: "Invalid JSON",
              }));
              // Store raw string to allow correction
              const newTask = {
                ...task,
                config: {
                  ...task.config,
                  [name]: inputVal,
                },
              };
              onChange(index, newTask);
            }
          }}
          className={`bg-white dark:bg-gray-700 text-black dark:text-white border ${
            showErrors && errors[name]
              ? "border-red-500"
              : "border-gray-300 dark:border-gray-600"
          } rounded px-2 py-1 w-full mb-2`}
          rows={4}
        />
      ) : (
        <input
          className={`bg-white dark:bg-gray-700 text-black dark:text-white border ${
            showErrors && errors[name]
              ? "border-red-500"
              : "border-gray-300 dark:border-gray-600"
          } rounded px-2 py-1 w-full mb-2`}
          type="text"
          name={name}
          value={value}
          onChange={handleInputChange}
        />
      )}

      {showErrors && errors[name] && (
        <p className="text-red-500 dark:text-red-400 text-sm mb-2">
          {errors[name]}
        </p>
      )}
    </div>
  );
};



  return (
    <div className="border p-3 my-2 rounded shadow-sm">
      <div>
        <label className="text-black dark:text-white">Type: </label>
        <select
          value={task.type}
          onChange={handleTypeChange}
          className="bg-white dark:bg-gray-700 text-black dark:text-white border border-gray-300 dark:border-gray-600 rounded px-2 py-1 mb-2"
        >
          <option value="api">API 🌐</option>
          <option value="shell">Shell 🖥️</option>
          <option value="db">Database 🗄️</option>
        </select>
        <button
          onClick={() => onRemove(index)}
          style={{ marginLeft: "1rem" }}
          className="bg-white dark:bg-gray-700 text-black dark:text-white border border-gray-300 dark:border-gray-600 rounded px-2 py-1 mb-2"
        >
          ❌ Remove
        </button>
      </div>

      <div style={{ marginTop: "1rem" }}>
        {task.type === "api" ? (
          <>
            {renderInput("url", task.config.url)}
            <div>
              <label className="text-black dark:text-white font-bold">Method: </label>
              <select
                name="method"
                value={task.config.method}
                onChange={handleInputChange}
                className="bg-white dark:bg-gray-700 text-black dark:text-white border border-gray-300 dark:border-gray-600 rounded px-2 py-1 w-full mb-2"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
              </select>
            </div>
            {task.config.method === "POST" && (
              <>
                {renderInput("headers", task.config.headers)}
                {renderInput("body", task.config.body)}
              </>
            )}
          </>
        ) : (
          Object.entries(task.config).map(([key, val]) => renderInput(key, val))
        )}
      </div>
      <ToastContainer position="top-center" autoClose={3000}/>
    </div>
  );
};

export default TaskForm;
