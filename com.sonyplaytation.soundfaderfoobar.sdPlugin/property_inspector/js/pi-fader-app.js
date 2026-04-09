// global websocket, used to communicate from/to Stream Deck software
// as well as some info about our plugin, as sent by Stream Deck software 
const form = document.querySelector('#property-inspector form');

var settings,
    settingsModel = {
        Mode: 0,
        AppName: "",
        AppId: "",
        Duration: 500,
        Target: 100,
        BendingOut: 0,
        BendingIn: 0,
        BendingTypeOut: "POW",
        BendingTypeIn: "POW",
        DisplayName: true,
    };

const FaderActionMode = {
        TOGGLE: 0,
        OUT: 1,
        IN: 2
    };

form.addEventListener('change', () => {
    let model = Utils.getFormValue(form);
    model.DisplayName = !!model.DisplayName;
    console.log("form changed", model);
    settings.settingsModel = model;
    settingsModel = model;
    $PI.setSettings(settings);
    updateState();
});

$PI.onConnected(async ({ actionInfo: { payload } }) => {
    settings = payload?.settings;
    if (settings?.settingsModel) {
        Object.keys(settings.settingsModel).forEach(key => {
            settingsModel[key] = settings.settingsModel[key];
        });
    }
    console.log("initial", settingsModel);

    LocalUtils.setFormValue(settingsModel, form);

    LocalUtils.setToolTipListeners(document.getElementById('txtDuration'));
    LocalUtils.setToolTipListeners(document.getElementById('txtTarget'));
    LocalUtils.setToolTipListeners(document.getElementById('txtBendingOut'));
    LocalUtils.setToolTipListeners(document.getElementById('txtBendingIn'));

    updateState();
});

$PI.onSendToPropertyInspector('jp.tsuteto.soundfader.app-fader', ({ payload }) => {
    refreshAppListFromJson(payload);
});

const updateState = () => {
    document.getElementById('target').style.display = settingsModel.Mode == FaderActionMode.IN ? null : "none";
}

const refreshAppListFromJson = (json) => {
    refreshAppList(JSON.parse(json));
}

const refreshAppList = (list) => {
    console.log("Refresh app list", list);

    let select = document.getElementById('selApp');
    [...select.children].forEach(e => e.remove());

    // Not selected
    if (!settingsModel.AppId) {
        const option = document.createElement('option');
        option.text = 'Select Application';
        option.value = '';
        option.selected = true;
        option.disabled = true;
        option.hidden = true;
        option.setAttribute("data-localize", "");
        select.appendChild(option);
    }

    // Selected but currently unavailable
    if (settingsModel.AppId && !list.some(a => a.Id == settingsModel.AppId)) {
        const option = document.createElement('option');
        option.text = settingsModel.AppName;
        option.value = settingsModel.AppId;
        option.selected = true;
        option.disabled = true;
        select.appendChild(option);
    }

    // Available list
    list.forEach(app => {
        let option = document.createElement("option");
        option.value = app.Id;
        option.text = app.Name;
        if (app.System) option.setAttribute("data-localize", "");
        select.appendChild(option);
    });

    LocalUtils.applyLocalization();

    select.value = settingsModel.AppId;
}
