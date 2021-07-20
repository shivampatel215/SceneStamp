import React from 'react';

import {connect} from "react-redux"
import {getCompilationData} from "../../actions/timestamp-actions"

import './Compilation_List.css'


const mapStateToProps = state => ({
  compilation_data : state.timestamp.compilation_data
})

class Compilation_List extends React.Component {

	componentWillMount(){
		if(this.props.compilation_data.length === 0) this.props.getCompilationData()
	}

	createNewCompilation(e) {
		e.preventDefault();
	}

  	render() {
  	var vids = [];
    this.props.compilation_data.forEach((vid, index) => {
      vids.push( 
       <tr key={index}>
       <td>{ vid.creation_time ? vid.creation_time : 0 } </td>
			<td>{vid.compilation_name}</td>
		    <td>{vid.timestamps.length}</td>
		</tr>
        )
    })

    return (
    	<div className='mainTable'>
       	<div className="tableHeader">
       		<table>
           <tbody>
	       		<tr>
              <th> Creation Time </th>
	       			<th>Compilation Title</th>
		    		<th>Num. of Timestamps</th>
	       		</tr>
             </tbody>
       		</table>
       	</div>
		 	<div className="tableBody">
       		<table>
           <tbody>
	       		{vids}
             </tbody>
       		</table>
       	</div>
		</div>
    );
  }
}

export default connect(mapStateToProps, {getCompilationData})(Compilation_List)