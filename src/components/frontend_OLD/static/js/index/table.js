'use strict';

var addData;
var syncData;

function normalizeSeasonValue(value) {
  const raw = String(value ?? '').trim();
  if (!/^\d+$/.test(raw)) return null;
  return String(parseInt(raw, 10));
}

function sortSeasonKeys(keys) {
  return [...keys].sort((a, b) => {
    const aNum = /^\d+$/.test(a);
    const bNum = /^\d+$/.test(b);
    if (aNum && bNum) return parseInt(a, 10) - parseInt(b, 10);
    if (aNum) return -1;
    if (bNum) return 1;
    return a.localeCompare(b);
  });
}

class Table extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      error: false,
      is_loaded: false,
      data: null
    };
    this.addData = this.addData.bind(this);
    this.removeData = this.removeData.bind(this);
    this.editData = this.editData.bind(this);
    addData = this.addData;
	syncData = this.syncData.bind(this);;
  }

  componentDidMount() {
    this.syncData();
  }

  syncData() {
    fetch("/api/table").then(res => res.json()).then(res => {
      this.setState({
        error: res.error,
        is_loaded: true,
        data: res.data
      });
    }, error => {
      this.setState({
        error: error,
        is_loaded: true,
        data: null
      });
    });
  }

  addData(title, season, links, absolute = false) {
    return fetch('/api/table/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: title,
        season: season,
        links: links,
        absolute: absolute
      })
    }).then(response => response.json()).then(data => {
      showToast(data.data);
      this.syncData();
    });
  }

  removeData(title, season = null, link = null) {
    return fetch('/api/table/remove', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: title,
        season: season,
        link: link
      })
    }).then(response => response.json()).then(data => {
      showToast(data.data);
      this.syncData();
    });
  }

  editData(title, season = null, link = null) {
    return fetch('/api/table/edit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: title,
        season: season,
        link: link
      })
    }).then(response => response.json()).then(data => {
      showToast(data.data);
      this.syncData();
    });
  }

  render() {
    const {
      error,
      is_loaded,
      data
    } = this.state;

    if (error) {
      return /*#__PURE__*/React.createElement("div", null, "Error: ", error);
    } else if (!is_loaded) {
      return /*#__PURE__*/React.createElement("div", null);
    } else {
      return data.map(anime => /*#__PURE__*/React.createElement(TableRow, {
        title: anime.title,
        seasons: anime.seasons,
        absolute: anime.absolute,
        key: anime.title,
        onAddData: this.addData,
        onEditData: this.editData,
        onRemoveData: this.removeData
      }));
    }
  }

}

function TableRow(props) {
  return /*#__PURE__*/React.createElement("details", null, /*#__PURE__*/React.createElement(TableRowHead, {
    title: props.title,
    absolute: props.absolute,
    onEditData: props.onEditData,
    onRemoveData: props.onRemoveData
  }), /*#__PURE__*/React.createElement(TableRowBody, {
    seasons: props.seasons,
    onAddData: (season, links) => props.onAddData(props.title, season, links, props.absolute),
    onEditData: (season = null, link = null) => props.onEditData(props.title, season, link),
    onRemoveData: (season = null, link = null) => props.onRemoveData(props.title, season, link)
  }));
}

class TableRowHead extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      edit: false,
      value: this.props.title
    };
  }

  render() {
    return /*#__PURE__*/React.createElement("summary", {
      onContextMenu: e => {
        menu.show(e, ["Copy", "Edit", "Delete"], [() => navigator.clipboard.writeText(this.props.title), () => this.setState({
          edit: true
        }), () => this.props.onRemoveData(this.props.title)]);
      }
    }, this.state.edit ? /*#__PURE__*/React.createElement("form", {
      style: {
        display: "inline"
      },
      onSubmit: event => {
        event.preventDefault();
        this.props.onEditData([this.props.title, this.state.value]);
        this.setState({
          edit: false
        });
      },
      onKeyDown: event => {
        if (event.key == 'Escape') this.setState({
          edit: false,
          value: this.props.title
        });
      }
    }, /*#__PURE__*/React.createElement("input", {
      autoFocus: true,
      type: "text",
      placeholder: "this.props.title",
      value: this.state.value,
      onChange: event => this.setState({
        value: event.target.value
      }),
      onBlur: event => {
        if (this.state.value == this.props.title) this.setState({
          edit: false
        });
      }
    })) : this.state.value, this.props.absolute && /*#__PURE__*/React.createElement(Badge, {
      title: "absolute"
    }));
  }

}

class TableRowBody extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tab_active: 0
    };
  }

  render() {
    const orderedSeasons = sortSeasonKeys(Object.keys(this.props.seasons));

    return /*#__PURE__*/React.createElement("div", {
      className: "content"
    }, /*#__PURE__*/React.createElement("div", {
      className: "tabs"
    }, orderedSeasons.map((season, index) => /*#__PURE__*/React.createElement(Tab, {
      season: season,
      active: index == this.state.tab_active,
      key: index,
      onClick: e => this.setState({
        tab_active: index
      }),
      onEditData: this.props.onEditData,
      onRemoveData: this.props.onRemoveData
    })), /*#__PURE__*/React.createElement(AddSeasonButton, {
      onAddData: this.props.onAddData
    })), /*#__PURE__*/React.createElement("div", {
      className: "tabs-content"
    }, orderedSeasons.map((season, index) => /*#__PURE__*/React.createElement(TabContent, {
      links: this.props.seasons[season],
      active: index == this.state.tab_active,
      key: index,
      onAddData: links => this.props.onAddData(season, links),
      onEditData: (link = null) => this.props.onEditData(season, link),
      onRemoveData: (link = null) => this.props.onRemoveData(season, link)
    }))));
  }

}

class Tab extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      edit: false,
      value: this.props.season
    };
  }

  render() {
    const isNumericSeason = /^\d+$/.test(this.props.season);

    return this.state.edit ? /*#__PURE__*/React.createElement("form", {
      style: {
        display: "inline"
      },
      onSubmit: event => {
        event.preventDefault();
        const normalized = isNumericSeason ? normalizeSeasonValue(this.state.value) : String(this.state.value ?? '').trim();
        if (!normalized) {
          showToast("Numero stagione non valido.");
          return;
        }
        this.props.onEditData([this.props.season, normalized]);
        this.setState({
          edit: false,
          value: normalized
        });
      },
      onKeyDown: event => {
        if (event.key == 'Escape') this.setState({
          edit: false,
          value: this.props.season
        });
      }
    }, /*#__PURE__*/React.createElement("input", {
      autoFocus: true,
      className: "add-tab",
      type: isNumericSeason ? "number" : "text",
      min: isNumericSeason ? "0" : undefined,
      step: isNumericSeason ? "1" : undefined,
      placeholder: this.props.season,
      value: this.state.value,
      onChange: event => this.setState({
        value: event.target.value
      }),
      onBlur: event => {
        if (this.state.value == this.props.season) this.setState({
          edit: false
        });
      }
    })) : /*#__PURE__*/React.createElement("a", {
      className: this.props.active ? "tab active" : "tab",
      onClick: this.props.onClick,
      onContextMenu: e => {
        menu.show(e, ["Copy", "Edit", "Delete"], [() => navigator.clipboard.writeText(this.state.value.toUpperCase()), () => this.setState({
          edit: true
        }), () => this.props.onRemoveData(this.state.value)]);
      }
    }, this.state.value.toUpperCase());
  }

}

function TabContent(props) {
  return /*#__PURE__*/React.createElement("div", {
    className: props.active ? "tab-content active" : "tab-content"
  }, props.links.map(link => /*#__PURE__*/React.createElement(TabContentLink, {
    link: link,
    onRemoveData: props.onRemoveData,
    onEditData: props.onEditData,
    key: link
  })), /*#__PURE__*/React.createElement(AddLinkButton, {
    onAddData: props.onAddData
  }));
}

class TabContentLink extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      edit: false,
      value: this.props.link
    };
  }

  render() {
    return this.state.edit ? /*#__PURE__*/React.createElement("form", {
      style: {
        display: "inline"
      },
      onSubmit: event => {
        event.preventDefault();
        this.props.onEditData([this.props.link, this.state.value]);
        this.setState({
          edit: false
        });
      },
      onKeyDown: event => {
        if (event.key == 'Escape') this.setState({
          edit: false,
          value: this.props.link
        });
      }
    }, /*#__PURE__*/React.createElement("input", {
      autoFocus: true,
      type: "text",
      placeholder: this.props.link,
      value: this.state.value,
      pattern: "^(https|http):\\/\\/.+",
      onChange: event => this.setState({
        value: event.target.value
      }),
      onBlur: event => {
        if (this.state.value == this.props.link) this.setState({
          edit: false
        });
      }
    })) : /*#__PURE__*/React.createElement("a", {
      href: this.state.value,
      target: "_blank",
      onContextMenu: e => {
        menu.show(e, ["Copy", "Edit", "Delete"], [() => navigator.clipboard.writeText(this.state.value), () => this.setState({
          edit: true
        }), () => this.props.onRemoveData(this.state.value)]);
      }
    }, this.state.value);
  }

}

class AddLinkButton extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      active: false,
      value: ''
    };
  }

  render() {
    return /*#__PURE__*/React.createElement(React.Fragment, null, this.state.active && /*#__PURE__*/React.createElement("form", {
      onSubmit: event => {
        event.preventDefault();
        this.props.onAddData([this.state.value]);
        this.setState({
          active: false,
          value: ''
        });
      },
      onKeyDown: event => {
        if (event.key == 'Escape') this.setState({
          active: false,
          value: ''
        });
      }
    }, /*#__PURE__*/React.createElement("input", {
      autoFocus: true,
      type: "text",
      placeholder: "https://www.animeworld.so/play/...",
      pattern: "^(https|http):\\/\\/.+",
      value: this.state.value,
      onChange: event => this.setState({
        value: event.target.value
      }),
      onBlur: event => {
        if (!this.state.value) this.setState({
          active: false,
          value: ''
        });
      }
    })), /*#__PURE__*/React.createElement("button", {
      className: "btn add-link",
      onClick: () => this.setState({
        active: true
      })
    }, '\ue145'));
  }

}

class AddSeasonButton extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      active: false,
      value: ''
    };
  }

  render() {
    return /*#__PURE__*/React.createElement(React.Fragment, null, this.state.active && /*#__PURE__*/React.createElement("form", {
      onSubmit: event => {
        event.preventDefault();
        const normalized = normalizeSeasonValue(this.state.value);
        if (!normalized) {
          showToast("Numero stagione non valido.");
          return;
        }
        this.props.onAddData(normalized, []);
        this.setState({
          active: false,
          value: ''
        });
      },
      onKeyDown: event => {
        if (event.key == 'Escape') this.setState({
          active: false,
          value: ''
        });
      }
    }, /*#__PURE__*/React.createElement("input", {
      autoFocus: true,
      type: "number",
      placeholder: "Season",
      className: "add-tab",
      min: "0",
      step: "1",
      value: this.state.value,
      onChange: event => this.setState({
        value: event.target.value
      }),
      onBlur: event => {
        if (!this.state.value) this.setState({
          active: false,
          value: ''
        });
      }
    })), /*#__PURE__*/React.createElement("a", {
      className: "btn add-tab",
      onClick: () => this.setState({
        active: true
      })
    }, '\ue145'));
  }

}

function Badge(props) {
  return /*#__PURE__*/React.createElement("span", {
    className: "badge"
  }, props.title);
}

const container = document.querySelector('#root');
ReactDOM.render( /*#__PURE__*/React.createElement(React.StrictMode, null, /*#__PURE__*/React.createElement(Table, null)), container);
