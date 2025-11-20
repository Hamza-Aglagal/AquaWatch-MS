Param(
    [string]$prediction_id = "PS",
    [string]$latitude = "34.0",
    [string]$longitude = "-6.0",
    [string]$score = "2.5"
)

$json = '{"prediction_id":"' + $prediction_id + '","zone":{"latitude":' + $latitude + ',"longitude":' + $longitude + '},"predictions":{"qualite_eau":"MAUVAISE","score_qualite":' + $score + '},"confidence":0.9,"timestamp":"' + (Get-Date).ToString('o') + '"}'

Write-Host "Publishing payload:" $json

docker compose exec redis_queue sh -c "redis-cli PUBLISH new_prediction '$json'"
