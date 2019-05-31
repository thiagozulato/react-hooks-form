import React, { useCallback } from "react";
import ReactDOM from "react-dom";
import { Input, Select, Form, Button, Checkbox, Radio } from "antd";

import "antd/dist/antd.css";
import "./styles.css";

const formState = {
  name: "",
  initialState: {},
  values: {},
  touched: {},
  errors: {},
  isSubmitting: false
};

function useForm(
  name,
  initialState = {},
  validateErrors,
  submit,
  isPersisted = false
) {
  const [formValues, setFormValues] = React.useState(() => {
    formState.name = name;
    formState.initialState = initialState;
    formState.values = initialState;
    return formState;
  });

  React.useEffect(() => {
    if (isPersisted) {
      localStorage.setItem(formValues.name, JSON.stringify(formValues));
    }
  }, [formValues, isPersisted]);

  const isValid = React.useCallback(
    () => Object.keys(formValues.errors).length > 0,
    [formValues.errors]
  );

  const validateForm = useCallback(
    state => {
      return new Promise(resolve => {
        const errors = validateErrors(state.values);
        state.errors = errors;

        resolve(errors);
      });
    },
    [validateErrors]
  );

  const onChange = event => {
    if (event.persist && typeof event.persist === "function") event.persist();

    setFormValues(prev => {
      const newState = {
        ...prev,
        values: {
          ...prev.values,
          [event.target.name]:
            event.target.type === "checkbox"
              ? event.target.checked
              : event.target.value
        }
      };

      Promise.resolve(validateForm(newState));

      return newState;
    });
  };

  const onBlur = event => {
    if (event.persist && typeof event.persist === "function") event.persist();

    setFormValues(prev => {
      const newState = {
        ...prev,
        touched: {
          ...prev.touched,
          [event.target.name]: true
        }
      };

      Promise.resolve(validateForm(newState));

      return newState;
    });
  };

  const setFieldValue = (field, value) => {
    setFormValues(prev => {
      const newState = {
        ...prev,
        values: {
          ...prev.values,
          [field]: value
        },
        touched: {
          ...prev.touched,
          [field]: true
        }
      };

      Promise.resolve(validateForm(newState));

      return newState;
    });
  };

  const submitform = useCallback(() => {
    touchAllFieldsOnSubmit();

    if (submit) {
      validateForm(formValues).then(errors => {
        const isValidForm = Object.keys(errors).length === 0;

        if (isValidForm) {
          Promise.resolve(submit(formValues.values))
            .then(() => {
              setFormValues(prev => ({
                ...prev,
                isSubmitting: false
              }));
            })
            .catch(() => {
              setFormValues(prev => ({
                ...prev,
                isSubmitting: false
              }));
            });
        } else {
          setFormValues(prev => ({
            ...prev,
            errors: errors,
            isSubmitting: false
          }));
        }
      });
    }
  }, [formValues, submit, validateForm]);

  const onSubmit = useCallback(
    event => {
      if (event) {
        event.preventDefault();

        if (event.persist && typeof event.persist === "function")
          event.persist();
      }

      submitform();
    },
    [submitform]
  );

  function touchAllFieldsOnSubmit() {
    const markedAllFieldsAsTouched = values => {
      return Object.keys(values).reduce((obj, key) => {
        obj[key] = true;
        return obj;
      }, {});
    };

    setFormValues(prev => ({
      ...prev,
      touched: markedAllFieldsAsTouched(prev.values),
      isSubmitting: true
    }));
  }

  function reset() {
    setFormValues(prev => ({
      ...prev,
      values: prev.initialState,
      errors: {},
      touched: {}
    }));
  }

  return {
    initialState: formValues.initialState,
    fields: formValues.values,
    touched: formValues.touched,
    errors: formValues.errors,
    isSubmitting: formValues.isSubmitting,
    isValid,
    events: {
      onChange,
      onBlur
    },
    onSubmit,
    setFieldValue,
    reset
  };
}

const todoListFields = {
  description: "",
  state: "",
  checkbox_value: false,
  radio_value: "a"
};

const formErrors = fields => {
  const errors = {};

  if (!fields.description) {
    errors.description = "Description required";
  } else if (fields.description.length < 6) {
    errors.description = "Description must have at least 6 characters";
  }

  if (!fields.state) {
    errors.state = "State required";
  }

  return errors;
};

const validateStatus = (touched, errors, field) => {
  if (!touched) return null;

  return errors[field] ? "error" : "success";
};

const TodoListForm = React.memo(({ initialValues }) => {
  const submit = values => {
    return new Promise(resolve => {
      setTimeout(() => {
        console.info(values);
        resolve();
      }, 3000);
    });
  };

  const {
    fields,
    initialState,
    touched,
    setFieldValue,
    isSubmitting,
    errors,
    isValid,
    onSubmit,
    reset,
    events
  } = useForm("todolistform", initialValues, formErrors, submit);

  return (
    <div className="todo-list-form">
      <h2>React Hooks Form</h2>
      <Form onSubmit={onSubmit} className="form-wrapper">
        <Form.Item
          label="Description"
          hasFeedback
          validateStatus={validateStatus(
            touched.description,
            errors,
            "description"
          )}
          help={touched.description && errors.description}
        >
          <Input
            type="text"
            name="description"
            size="large"
            value={fields.description}
            {...events}
          />
        </Form.Item>

        <Form.Item
          label="State"
          hasFeedback
          validateStatus={validateStatus(touched.state, errors, "state")}
          help={touched.state && errors.state}
        >
          <Select
            size="large"
            defaultValue={fields.state}
            value={fields.state}
            onBlur={value => setFieldValue("state", value)}
            onChange={value => setFieldValue("state", value)}
          >
            <Select.Option value="">Select</Select.Option>
            <Select.Option value="completed">Completed</Select.Option>
            <Select.Option value="active">Active</Select.Option>
            <Select.Option value="deleted">Deleted</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item>
          <Checkbox
            name="checkbox_value"
            defaultChecked={fields.checkbox_value}
            checked={fields.checkbox_value}
            {...events}
          >
            Complete All
          </Checkbox>
        </Form.Item>
        <Form.Item>
          <Radio.Group
            name="radio_value"
            defaultValue={fields.radio_value}
            {...events}
          >
            <Radio value="a">item 1</Radio>
            <Radio value="b">item 2</Radio>
            <Radio value="c">item 3</Radio>
          </Radio.Group>
        </Form.Item>

        <div>
          <Button
            loading={isSubmitting}
            type="primary"
            htmlType="submit"
            disabled={isSubmitting ? "disabled" : ""}
          >
            Send
          </Button>
          <Button type="ghost" htmlType="button" onClick={() => reset()}>
            Reset
          </Button>
        </div>
      </Form>
      <div className="form-values">
        <pre>
          {JSON.stringify(
            {
              fields,
              errors,
              initialState,
              touched,
              isValid,
              isSubmitting
            },
            null,
            2
          )}
        </pre>
      </div>
    </div>
  );
});

function App() {
  return (
    <div className="App">
      <TodoListForm initialValues={todoListFields} />
    </div>
  );
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
