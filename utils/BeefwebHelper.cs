using System;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace SoundFader.utils
{
    internal static class BeefwebHelper
    {
        private const string BaseUrl = "http://localhost:8880/api/";

        // Fetches current volume info from foobar2000 via beefweb.
        // Returns a VolumeInfo with value/min/max in dB.
        internal static async Task<VolumeInfo> GetVolumeAsync()
        {
            string response;
            using (var client = new WebClient())
            {
                response = await client.DownloadStringTaskAsync(BaseUrl + "player");
            }

            var json = JObject.Parse(response);
            var vol = json["player"]?["info"]?["volume"];

            if (vol == null)
                throw new InvalidOperationException("Could not read volume from beefweb response.");

            return new VolumeInfo
            {
                Value = vol["value"]!.Value<float>(),
                Min   = vol["min"]!.Value<float>(),
                Max   = vol["max"]!.Value<float>(),
            };
        }

        // Sets an absolute dB volume on foobar2000.
        internal static async Task SetVolumeAsync(float dB)
        {
            var body = JsonConvert.SerializeObject(new { volume = dB });
            using (var client = new WebClient())
            {
                client.Headers[HttpRequestHeader.ContentType] = "application/json";
                await client.UploadStringTaskAsync(BaseUrl + "player", "POST", body);
            }
        }
    }

    internal class VolumeInfo
    {
        public float Value { get; set; }  // current dB
        public float Min   { get; set; }  // e.g. -100
        public float Max   { get; set; }  // e.g.    0
    }
}