require 'sinatra'
require 'httparty'

get '/locations' do
  safe_param_keys = [:n, :s, :e, :w]
  safe_params = {}
  safe_param_keys.each do |key|
    safe_params[key] = params[key].to_f
  end
  url = "http://api.geonames.org/citiesJSON?"\
  "north=#{safe_params[:n]}&south=#{safe_params[:s]}&"\
  "east=#{safe_params[:e]}&west=#{safe_params[:w]}&lang=de&username=halozero"
  p "url is #{url}"
  response = HTTParty.get(url)
  response_json = JSON.parse(response.body)
  cities = response_json["geonames"]
  cities = cities.collect {|x| {name: x["name"], lat: x["lat"], lng: x["lng"]}}
  cities
end

get '/' do
  send_file 'index.html'
end