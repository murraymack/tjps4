import React, { useState, useEffect } from 'react';
import './App.css';
import Amplify, { API, Storage } from 'aws-amplify';
import awsconfig from './aws-exports';
import {AmplifySignOut, withAuthenticator} from '@aws-amplify/ui-react';
import { listTodos } from './graphql/queries';
import { createTodo as createNoteMutation, deleteTodo as deleteNoteMutation } from './graphql/mutations';

const initialFormState = { name: '', description: ''}

Amplify.configure(awsconfig);


function App() {
	const [notes, setNotes] = useState([]);
	const [formData, setFormData] = useState(initialFormState);

	useEffect(() => {
		fetchNotes();
		}, []);

	async function fetchNotes() {
		const apiData = await API.graphql({ query : listTodos });
		const notesFromAPI = apiData.data.listTodos.items;
		await Promise.all(notesFromAPI.map(async note=> {
			if (note.image) {
				const image = await Storage.get(note.image);
				note.image = image;
			}
		}))
		setNotes(apiData.data.listTodos.items);
	}

	async function createNote() {
		if (!formData.name || !formData.description) return;
		await API.graphql({ query: createNoteMutation, variables: { input : formData } });
		if (formData.image) {
			const image = await Storage.get(formData.image);
			formData.image = image;
		}
		setNotes([ ...notes, formData ]);
		setFormData(initialFormState);
	}

	async function deleteNote({ id }) {
		const newNotesArray = notes.filter(note => note.id !== id);
		setNotes(newNotesArray);
		await API.graphql({ query: deleteNoteMutation, variables: { input: { id } }});
	}

	async function onChange(e) {
		if (!e.target.files[0]) return;
		const file = e.target.files[0];
		setFormData({ ...formData, image: file.name});
		await Storage.put(file.name, file);
		fetchNotes();
	}

  return (
    <div className="App">
    	<h2>Triple J Project Controls</h2>
    	<h3>Transaction Process Audit Upload</h3>
    	<div>
    	<input
    		onChange={e => setFormData({ ...formData, 'name': e.target.value})}
    		placeholder="Project, e.g. 20017"
    		value={formData.name}
    	/>
    	<input
    		onChange={e => setFormData({ ...formData, 'description': e.target.value})}
    		placeholder="Description"
    		value={formData.description}
    	/>
    	</div>
    	<div>
	    	<input
	    		type="file"
	    		onChange={onChange}
	    	/>
    	</div>
    	<div>
    			<button onClick={createNote}>Upload</button>
    	</div>
    	{ 
    		notes.map(note=> (
    			<div key={note.id || note.name}>
    				<h2>{note.name}</h2>
    				<p>{note.description}</p>
    				{
    					note.image && <img src={note.image} style={{width: 400}} />
    				}
    				<div>
    					<button onClick={() => deleteNote(note)}>Delete Entry</button>
    				</div>
    			</div> 
    		))
    	}
    	<div style={{marginBottom: 30}}>
    	</div>
		<AmplifySignOut />
		<h3>Triple J Pipelines - Created by Me</h3>
    </div>
  );
}

export default withAuthenticator(App);
