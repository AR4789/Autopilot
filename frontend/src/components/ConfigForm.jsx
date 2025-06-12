import React, { useState, useImperativeHandle, forwardRef } from "react";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import TaskForm from "./TaskForm";
import { useSubscription } from "./SubscriptionContext";



const ConfigForm = forwardRef(({ config, setConfig, mode, setMode, onRunAutomation }, ref) => {
  const [validationErrors, setValidationErrors] = useState({});
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { plan, maxTasks } = useSubscription();


  const handleAddTask = (section) => {
    const totalTasks = mode === "advanced"
      ? config["pre"].length + config["post"].length
      : config["pre"].length;

    if (totalTasks >= maxTasks) {
      toast.dismiss();
      toast.error(`🚫 Limit reached! Your plan allows only ${maxTasks} tasks.`, {
        position: "top-center",
        autoClose: 3000,
        theme: "colored",
      });
      return;
    }

    const newTask = {
      type: "api",
      config: {
        url: "",
        method: "GET",
        headers: {},
        body: {},
      },
    };
    setConfig({
      ...config,
      [section]: [...config[section], newTask],
    });
  };


  const handleTaskChange = (section, index, newTask) => {
    const updatedTasks = [...config[section]];
    updatedTasks[index] = newTask;
    setConfig({ ...config, [section]: updatedTasks });
  };

  const handleRemoveTask = (section, index) => {
    const updatedTasks = config[section].filter((_, i) => i !== index);
    setConfig({ ...config, [section]: updatedTasks });

    const updatedErrors = { ...validationErrors };
    if (updatedErrors[section]) {
      updatedErrors[section].splice(index, 1);
    }
    setValidationErrors(updatedErrors);
  };

  const handleErrorChange = (section, index, errors) => {
    setValidationErrors((prev) => {
      const sectionErrors = prev[section] ? [...prev[section]] : [];
      sectionErrors[index] = errors;
      return {
        ...prev,
        [section]: sectionErrors,
      };
    });
  };

  const validateAll = () => {
    setShowValidationErrors(true);
    let isValid = true;
    let errorMessages = [];

    const sections = mode === "advanced" ? ["pre", "post"] : ["pre"];
    const hasAtLeastOneTask = sections.some(section => config[section].length > 0);
    if (!hasAtLeastOneTask) {
      toast.dismiss();
      toast.error("Please add at least one task before Launching.", {
        position: "top-center",
        autoclose: 3000,
        theme: "colored",
        icon: "❗"
      });
      return false;
    }

    for (const section of sections) {
      const sectionErrors = [];

      config[section].forEach((task, index) => {
        const taskErrors = {};
        for (const [key, value] of Object.entries(task.config)) {
          if (typeof value === "string" && value.trim() === "") {
            taskErrors[key] = `${key} is required`;
            isValid = false;
            errorMessages.push(`${key} is required.`);
          }
          if (
            typeof value === "object" &&
            task.type === "api" &&
            (key === "headers" || key === "body") &&
            Object.keys(value).length === 0 &&
            task.config.method === "POST"
          ) {
            taskErrors[key] = "Cannot be empty JSON";
            isValid = false;
            errorMessages.push(`Task ${index + 1} in ${section} section: ${key} cannot be empty JSON.`);
          }
        }
        sectionErrors[index] = taskErrors;
      });

      setValidationErrors((prev) => ({
        ...prev,
        [section]: sectionErrors,
      }));
    }

    if (errorMessages.length > 0) {
      toast.dismiss();
      toast.error("❗ Some fields are missing", {
        position: "top-center",
        autoClose: 2500,
        theme: "colored",
      });
    }
    return isValid;
  };

  const handleModeToggle = () => {
    setErrorMessage("");
    setShowValidationErrors(false);
    setValidationErrors({});
    setMode(mode === "advanced" ? "basic" : "advanced");
  };

  useImperativeHandle(ref, () => ({
    validateAndRun: () => {
      const isValid = validateAll();
      if (!isValid) {
        return false;
      }
      onRunAutomation(config);
      return true;
    }
  }));




  return (
    <div className="p-4 bg-white dark:bg-gray-900 text-black dark:text-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-2">
        🛠️ Current Mode: {mode === "advanced" ? "Advanced (Pre + Post Tasks)" : "Basic (Only Flyway Tasks)"}
      </h2>

      <button
        onClick={handleModeToggle}
        className="mb-6 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-600 transition"
      >
        {mode === "advanced"
          ? "➡️ Switch to Basic Mode (Only Flyway)"
          : "➡️ Switch to Advanced Mode (Pre + Post)"}
      </button>

      {errorMessage && (
        <div className="text-red-500 mb-4 font-medium">{errorMessage}</div>
      )}

      {mode === "basic" && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Tasks on Flyway</h3>
          {config["pre"].map((task, index) => (
            <TaskForm
              key={index}
              task={task}
              index={index}
              onChange={(i, newTask) => handleTaskChange("pre", i, newTask)}
              onRemove={(i) => handleRemoveTask("pre", i)}
              onErrorChange={(i, errors) => handleErrorChange("pre", i, errors)}
              showErrors={showValidationErrors}
            />
          ))}
          <button
            onClick={() => handleAddTask("pre")}
            className="mt-2 px-3 py-1 bg-green-600 dark:bg-green-500 text-white rounded hover:bg-green-700 dark:hover:bg-green-600 transition"
          >
            ➕ Add Task
          </button>
        </div>
      )}

      {mode === "advanced" &&
        ["pre", "post"].map((section) => (
          <div key={section} className="mb-6">
            <h3 className="text-lg font-semibold mb-2">{section.toUpperCase()} Tasks</h3>
            {config[section].map((task, index) => (
              <TaskForm
                key={index}
                task={task}
                index={index}
                onChange={(i, newTask) => handleTaskChange(section, i, newTask)}
                onRemove={(i) => handleRemoveTask(section, i)}
                onErrorChange={(i, errors) => handleErrorChange(section, i, errors)}
                showErrors={showValidationErrors}
              />
            ))}
            <button
              onClick={() => handleAddTask("pre")}
              disabled={config["pre"].length + (mode === "advanced" ? config["post"].length : 0) >= maxTasks}
              className={`mt-2 px-3 py-1 rounded text-white transition ${config["pre"].length + (mode === "advanced" ? config["post"].length : 0) >= maxTasks
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 dark:bg-green-500 hover:bg-green-700 dark:hover:bg-green-600"
                }`}
            >
              ➕ Add Task
            </button>

          </div>
        ))}

    </div>
  );
});

export default ConfigForm;
