using System;
using System.Threading.Tasks;
using SoundFader.models;
using SoundFader.utils;
using StreamDeckLib;

namespace SoundFader.controllers
{
    /// <summary>
    /// Controls foobar2000 volume through the beefweb HTTP API (http://localhost:8880).
    ///
    /// Volume mapping
    /// ──────────────
    /// FadingTask works in a 0.0 – 1.0 scalar space.
    /// Beefweb exposes volume in dB (e.g. –100 dB … 0 dB for foobar2000).
    ///
    /// Conversion:
    ///   scalar → dB  :  dB = min + scalar * (max – min)
    ///   dB → scalar  :  scalar = (dB – min) / (max – min)
    /// </summary>
    internal class SoundFaderFoobar : SoundFaderCommon
    {
        public static async void PerformFading(
            ConnectionManager manager,
            string context,
            FoobarFaderSettingModel settings)
        {
            // ── 1. Read current foobar volume ────────────────────────────────
            VolumeInfo volInfo;
            try
            {
                volInfo = await BeefwebHelper.GetVolumeAsync();
            }
            catch (Exception ex)
            {
                await manager.LogMessageAsync(context, $"[SoundFaderFoobar] Could not reach beefweb: {ex.Message}");
                await manager.ShowAlertAsync(context);
                return;
            }

            static float Clamp(float value, float min, float max)
            {
                if (min > max)
                {
                    Exception ex;
                }

                if (value < min)
                {
                    return min;
                }
                else if (value > max)
                {
                    return max;
                }

                return value;
            }

            float dbMin   = volInfo.Min;   // e.g. –100
            float dbMax   = volInfo.Max;   // e.g.    0
            float dbRange = dbMax - dbMin; // e.g.  100

            // Convert current dB → scalar so FadingTask can interpolate from it
            float initialScalar = (volInfo.Value - dbMin) / dbRange;

            // ── 2. Build the setAudioVolume callback ─────────────────────────
            // FadingTask calls this with a 0–1 scalar; we convert to dB and POST.
            Action<float> setAudioVolume = scalar =>
            {
                float db = dbMin + scalar * dbRange;
                db = Clamp(db, dbMin, dbMax);
                // Fire-and-forget — beefweb handles rapid calls fine
                _ = BeefwebHelper.SetVolumeAsync(db);
            };

            // ── 3. Run the fade ──────────────────────────────────────────────
            FadeDir fader = settings.FaderT;

            _ = Task.Run(() => FadingTask(
                    manager, context, fader,
                    initialScalar,
                    settings.Duration,
                    settings.Target,
                    settings.BendingOut,
                    settings.BendingIn,
                    settings.BendingTypeOutT,
                    settings.BendingTypeInT,
                    setAudioVolume)
                ).ContinueWith(async _ =>
                {
                    // ── 4. Toggle mode bookkeeping ───────────────────────────
                    if (settings.ModeT == FaderActionMode.TOGGLE)
                    {
                        if (fader == FadeDir.OUT)
                        {
                            // Remember where we faded from so we can fade back
                            settings.Target = initialScalar * 100f;
                        }

                        settings.FaderT = fader switch
                        {
                            FadeDir.OUT => FadeDir.IN,
                            FadeDir.IN  => FadeDir.OUT,
                            _           => FadeDir.OUT
                        };

                        await manager.SetSettingsAsync(context, settings);
                    }
                });
        }
    }
}
