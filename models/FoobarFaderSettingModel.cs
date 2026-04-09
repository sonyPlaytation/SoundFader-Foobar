namespace SoundFader.models
{
    // Settings stored on the Stream Deck key for the Foobar/beefweb fader action.
    // Inherits all common fade parameters (Duration, Target, Bending, Mode, etc.)
    // from SoundFaderSettingModel.
    internal class FoobarFaderSettingModel : SoundFaderSettingModel
    {
        // Nothing extra needed for now — all behaviour comes from the base class.
        // Add foobar-specific options here later if required
        // (e.g. a configurable base URL for remote control).
    }
}
