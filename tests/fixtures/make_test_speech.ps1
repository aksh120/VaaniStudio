$wavPath = "$env:TEMP\test_speech.wav"
$convPath = "$env:TEMP\test_speech_16k.wav"

$voice = New-Object -ComObject SAPI.SpVoice
$stream = New-Object -ComObject SAPI.SpFileStream
$stream.Open($wavPath, 3)
$voice.AudioOutputStream = $stream
$voice.Speak("Welcome to Vaani Studio subtitle generator")
$stream.Close()

& "C:\ffmpeg\bin\ffmpeg.exe" -y -i $wavPath -ar 16000 -ac 1 $convPath
Write-Host "Success: $convPath"
