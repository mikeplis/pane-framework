import React from "react";

const PaneContext = React.createContext();

function usePane() {
  const context = React.useContext(PaneContext);
  return context;
}

function paneReducer(state, action) {
  switch (action.type) {
    case "REGISTER":
      return { ...state, forms: [...state.forms, action.formKey] };
    case "DEREGISTER":
      return {
        ...state,
        forms: state.forms.filter(formKey => formKey !== action.formKey)
      };
    default:
      throw Error("Unrecognized action type", action);
  }
}

function Pane({ children }) {
  const [state, dispatch] = React.useReducer(paneReducer, { forms: [] });
  const value = [state, dispatch];
  return <PaneContext.Provider value={value}>{children}</PaneContext.Provider>;
}

function Form({ formKey, onSubmit, children }) {
  const [, dispatch] = usePane();

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit();
  }

  React.useEffect(() => {
    dispatch({ type: "REGISTER", formKey });
    return () => dispatch({ type: "DEREGISTER", formKey });
  }, [formKey, dispatch]);

  return <form onSubmit={handleSubmit}>{children}</form>;
}

function useForm({ initialValues = {} } = {}) {
  const [values, setValues] = React.useState(initialValues);

  function handleChange(key, value) {
    setValues({ ...values, [key]: value });
  }

  return { values, onChange: handleChange };
}

const NameForm = ({ formKey, initialValues }) => {
  const { values, onChange } = useForm({ initialValues });
  return (
    <Form formKey={formKey}>
      <label>First name</label>
      <input
        value={values.first}
        onChange={e => onChange("first", e.target.value)}
      />
      <label>Last name</label>
      <input
        value={values.last}
        onChange={e => onChange("last", e.target.value)}
      />
    </Form>
  );
};

const AddressForm = ({ formKey, initialValues }) => {
  const { values, onChange } = useForm({ initialValues });
  return (
    <Form formKey={formKey}>
      <label>Address</label>
      <input
        value={values.address}
        onChange={e => onChange("address", e.target.value)}
      />
      <label>City</label>
      <input
        value={values.city}
        onChange={e => onChange("city", e.target.value)}
      />
    </Form>
  );
};

function UserPane(props) {
  const {
    user: { first, last, address, city }
  } = props;
  return (
    <Pane>
      <NameForm formKey="name" initialValues={{ first, last }} />
      <AddressForm formKey="address" initialValues={{ address, city }} />
    </Pane>
  );
}

function ProductPane(props) {
  return <div>Product Pane</div>;
}

class SimplePaneContext extends React.Component {
  handleSubmit = () => {
    /**
     * In NSP, this would dispatch an action and update a piece of state
     * that the Pane would be subscribed to. When this state changes, the Pane
     * would trigger its own submission inside of componentDidUpdate.
     *
     * To simplify things here, I'm just calling the handleSubmit method on
     * the component instance which simulates the same basic idea, which is
     * that the Pane is responsible for defining what happens when it is submitted
     * but that the "Pane context" (aka Step Wizard, Edit Modal, etc) is responsible
     * for triggering form submission.
     */
    console.log("SimplePaneContext handleSubmit");
    this.pane.handleSubmit();
  };

  render() {
    return (
      <div>
        <UserPane
          // Shape of data doesn't necessarily match the shape of the forms
          // Pane Context is responsible for passing data into Pane
          user={{
            first: "John",
            last: "Doe",
            address: "1 Willow Lane",
            city: "Stardew Valley"
          }}
          ref={el => (this.pane = el)}
        />
        <button onClick={this.handleSubmit}>Submit</button>
      </div>
    );
  }
}

class WizardPaneContext extends React.Component {
  panes = [];

  state = {
    step: 0
  };

  handleSubmit = () => {
    this.panes[this.state.step].handleSubmit();
    console.log("WizardPaneContext handleSubmit");
    if (this.state.step === 0) {
      this.setState(prevState => ({ step: prevState.step + 1 }));
    }
  };

  render() {
    const { step } = this.state;
    return (
      <div>
        {step === 0 && (
          <UserPane
            user={{
              first: "Jane",
              last: "Doe",
              address: "2 Willow Lane",
              city: "Stardew Valley"
            }}
            ref={el => (this.panes[0] = el)}
          />
        )}
        {step === 1 && <ProductPane ref={el => (this.panes[1] = el)} />}
        <button onClick={this.handleSubmit}>
          {step === 0 ? "Next" : "Submit"}
        </button>
      </div>
    );
  }
}

export function App() {
  return (
    <div>
      <h4>SimplePaneContext</h4>
      <SimplePaneContext />
      <h4>WizardPaneContext</h4>
      <WizardPaneContext />
    </div>
  );
}
