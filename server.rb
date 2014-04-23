require 'sinatra'
require 'httparty'
require 'pry'
require 'json'

get '/locations' do
  safe_param_keys = [:n, :s, :e, :w]
  safe_params = {}
  safe_param_keys.each do |key|
    safe_params[key] = params[key].to_f
  end

  url = "http://api.geonames.org/citiesJSON?"\
  "north=#{safe_params[:n]}&south=#{safe_params[:s]}&"\
  "east=#{safe_params[:e]}&west=#{safe_params[:w]}&lang=de&username=halozero"

  response = HTTParty.get(url)
  response_json = JSON.parse(response.body)

  success = true
  cities = []

  if response_json["geonames"].nil?
    p "response json for names is nil"
    success = false
  else
    cities = response_json["geonames"].collect do |x|
      { name: x["name"], lat: x["lat"], lng: x["lng"] }
    end
  end

  { success: success, cities: cities }.to_json
end

get '/' do
  send_file 'index.html'
end