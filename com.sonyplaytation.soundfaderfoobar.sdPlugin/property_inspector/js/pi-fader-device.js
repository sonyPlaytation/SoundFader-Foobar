// global websocket, used to communicate from/to Stream Deck software
// as well as some info about our plugin, as sent by Stream Deck software 
const form = document.querySelector('#property-inspector form');

var settings,
    settingsModel = {
        Mode: 0,
        DeviceName: "",
        DeviceId: "",
        Direction: null,
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
const Direction = {
    OUT: 0,
    IN: 1
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

$PI.onSendToPropertyInspector('jp.tsuteto.soundfader.device-fader', ({ payload }) => {
    refreshDeviceListFromJson(payload);
});

const updateState = () => {
    document.getElementById('target').style.display = settingsModel.Mode == FaderActionMode.IN ? null : "none";
}

const refreshDeviceListFromJson = (json) => {
    refreshDeviceList(JSON.parse(json));
}

const refreshDeviceList = async (list) => {
    console.log("Refresh device list", list);

    let select = document.getElementById("selDevice");
    [...select.children].forEach(e => e.remove());

    // Not selected
    let notSelected;
    if (!settingsModel.DeviceId) {
        notSelected = document.createElement('option');
        notSelected.text = 'Select Device';
        notSelected.value = '';
        notSelected.selected = true;
        notSelected.disabled = true;
        notSelected.hidden = true;
        notSelected.setAttribute("data-localize", null);
    }

    // Output devices
    let outGrp = document.createElement("optgroup");
    outGrp.label = "Output";
    outGrp.setAttribute("data-localize", "");

    if (settingsModel.DeviceId && settingsModel.Direction == Direction.OUT
        && !list.some(a => a.Id == settingsModel.DeviceId)) {
        const option = document.createElement('option');
        option.text = settingsModel.DeviceName;
        option.value = settingsModel.DeviceId;
        option.selected = true;
        option.disabled = true;
        outGrp.appendChild(option);
    }
    list.filter(d => d.Direction == Direction.OUT)
        .forEach(d => {
            let option = document.createElement("option");
            option.value = d.Id;
            option.text = d.Name;
            if (d.Default) option.setAttribute("data-localize", "");
            outGrp.appendChild(option);
        });

    // Input devices
    let inGrp = document.createElement("optgroup");
    inGrp.label = "Input";
    inGrp.setAttribute("data-localize", "");

    if (settingsModel.DeviceId && settingsModel.Direction == Direction.IN
        && !list.some(a => a.Id == settingsModel.DeviceId)) {
        const option = document.createElement('option');
        option.text = settingsModel.DeviceName;
        option.value = settingsModel.DeviceId;
        option.selected = true;
        option.disabled = true;
        inGrp.appendChild(option);
    }
    list.filter(d => d.Direction == Direction.IN)
        .forEach(d => {
            let option = document.createElement("option");
            option.value = d.Id;
            option.text = d.Name;
            if (d.Default) option.setAttribute("data-localize", "");
            inGrp.appendChild(option);
        });

    // Arrange options
    if (notSelected) {
        select.appendChild(notSelected);
    }
    select.appendChild(outGrp);
    select.appendChild(inGrp);

    await LocalUtils.applyLocalization();

    select.value = settingsModel.DeviceId;
}

