from ...backend import Core

from apiflask import APIBlueprint, abort, fields
from datetime import datetime

def Settings(core:Core) -> APIBlueprint:

	route = APIBlueprint('settings', __name__, url_prefix='/settings', tag='Settings')
	
	@route.after_request
	def cors(res):
		res.headers['Access-Control-Allow-Origin'] = '*'
		res.headers['Access-Control-Allow-Headers'] = '*'
		res.headers['Access-Control-Allow-Methods'] = '*'
		return res

	@route.get('/')
	def get_settings():
		"""Restituisce le impostazioni."""

		return core.settings.getData()
	
	@route.patch('/<setting>')
	@route.input({'value': fields.Raw()})
	def edit_settings(setting:str, json_data:dict):
		"""Modifica un impostazione."""
		
		if setting not in core.settings:
			abort(400, f"L'impostazione '{setting}' non esiste.")

		value = json_data['value']

		if setting in ("ActiveWindowStart", "ActiveWindowEnd"):
			if not isinstance(value, str):
				abort(400, f"'{setting}' deve essere una stringa nel formato HH:MM.")
			try:
				datetime.strptime(value, "%H:%M")
			except ValueError:
				abort(400, f"'{setting}' non è nel formato valido HH:MM.")

		core.settings[setting] = value

		return {'message': f"Impostazione '{setting}' aggiornata."}

	return route
