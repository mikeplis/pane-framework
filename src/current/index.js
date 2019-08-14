import React from "react";

/**
 * Simple HOC to simulate redux-form.
 *
 * Its main purpose is to just show that the Pane wraps each
 * registered form in an HOC to add additional functionality
 */
const withForm = config => WrappedComponent => {
  return class WithForm extends React.Component {
    state = {
      values: config.initialValues
    };

    handleChange = (key, value) => {
      this.setState(prevState => ({
        ...prevState,
        values: {
          ...prevState.values,
          [key]: value
        }
      }));
    };

    render() {
      return (
        <WrappedComponent
          {...this.props}
          onChange={this.handleChange}
          values={this.state.values}
        />
      );
    }
  };
};

const withPane = WrappedComponent => {
  return class WithPane extends React.Component {
    forms = [];

    setHandleSubmit(onSubmit) {
      this.handleSubmit = () => {
        /**
         * In NSP, we'd have access to the form values here via Redux,
         * but I'm too lazy to set that up here.
         *
         * The point here is that the Pane will call the configured `onSubmit`
         * method whenever its handleSubmit method is called.
         *
         * It's also possible to run some submission code that is common
         * to all Panes here.
         */
        console.log("WithPane handleSubmit");
        onSubmit();
      };
    }

    initPane = config => {
      this.setHandleSubmit(config.onSubmit);
    };

    createPaneForm = (formKey, formComponent, formConfig = {}) => {
      // "Register" the Form with the Pane
      this.forms.push(formKey);

      // Create a "connected" form component
      return withForm(formConfig)(formComponent);
    };

    render() {
      const { initPane, createPaneForm } = this;
      const newProps = {
        initPane,
        createPaneForm
      };
      return <WrappedComponent {...this.props} {...newProps} />;
    }
  };
};

const NameForm = props => {
  // These come from withForm, which is called inside
  const { values, onChange } = props;
  return (
    <div>
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
    </div>
  );
};

const AddressForm = props => {
  const { values, onChange } = props;
  return (
    <div>
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
    </div>
  );
};

const UserPane = withPane(
  class UserPane extends React.Component {
    constructor(props) {
      super(props);

      props.initPane({
        /**
         * Pane defines the submit behavior it knows about here.
         *
         * In NSP, this is done with a combination of submitActionCreator,
         * onPreSave, and onPostSave, but a simple onSubmit is good enough
         * here
         */
        onSubmit: () => console.log("UserPane submit")
      });

      this.UserNameForm = props.createPaneForm("name", NameForm, {
        initialValues: { first: props.user.first, last: props.user.last }
      });
      this.UserAddressForm = props.createPaneForm("address", AddressForm, {
        initialValues: { address: props.user.address, city: props.user.city }
      });
    }

    render() {
      const { UserNameForm, UserAddressForm } = this;
      return (
        <div>
          <UserNameForm />
          <UserAddressForm />
        </div>
      );
    }
  }
);

// Example of a Pane without forms
const ProductPane = withPane(
  class ProductPane extends React.Component {
    constructor(props) {
      super(props);

      props.initPane({
        /**
         * Pane defines the submit behavior it knows about here.
         *
         * In NSP, this is done with a combination of submitActionCreator,
         * onPreSave, and onPostSave, but a simple onSubmit is good enough
         * here
         */
        onSubmit: () => console.log("ProductPane submit")
      });
    }

    state = {
      value: ""
    };

    handleChange = e => {
      this.setState({ value: e.target.value });
    };

    render() {
      return (
        <div>
          <label>Product Name</label>
          <input value={this.state.value} onChange={this.handleChange} />
        </div>
      );
    }
  }
);

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

/**
 * Simple example of a two-step form that submits a pane when it advances to
 * the next step
 */
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
