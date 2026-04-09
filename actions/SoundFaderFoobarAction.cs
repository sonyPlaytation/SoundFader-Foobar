using System;
using System.Threading.Tasks;
using SoundFader.actionbase;
using SoundFader.controllers;
using SoundFader.models;
using StreamDeckLib;
using StreamDeckLib.Messages;

namespace SoundFader.actions
{
    [ActionUuid(Uuid = "jp.tsuteto.soundfader.foobar-fader")]
    class SoundFaderFoobarAction : BaseCustomSdActionWithSettingsModel<FoobarFaderSettingModel>
    {
        public override async Task OnKeyUp(StreamDeckEventPayload args)
        {
            try
            {
                SoundFaderFoobar.PerformFading(this.Manager, args.context, this.SettingsModel);
            }
            catch (Exception ex)
            {
                await Manager.LogMessageAsync(args.context, ex.ToString());
            }
        }

        public override async Task OnDidReceiveSettings(StreamDeckEventPayload args)
        {
            await base.OnDidReceiveSettings(args);
            try
            {
                if (this.SettingsModel.ModeT != FaderActionMode.TOGGLE)
                {
                    this.SettingsModel.FaderT =
                        this.SettingsModel.ModeT == FaderActionMode.IN ? FadeDir.IN : FadeDir.OUT;
                }
                await Manager.SetSettingsAsync(args.context, this.SettingsModel);
            }
            catch (Exception ex)
            {
                await Manager.LogMessageAsync(args.context, ex.ToString());
            }
        }
    }
}