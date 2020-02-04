/*
 * Copyright (C) 2017  Ben Ockmore
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with this program; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */

import PropTypes from 'prop-types';
import React from 'react';
import Relationship from '../../../entity-editor/relationship-editor/relationship';


function EntityRelationships({contextEntity, relationships}) {
	return (
		<div>
			<h2>Relationships</h2>
			{relationships &&
			<ul className="list-unstyled">
				{relationships.map((relationship) => (
					<li
						key={relationship.id}
					>
						<Relationship
							link
							contextEntity={contextEntity}
							relationshipType={relationship.type}
							sourceEntity={relationship.source}
							targetEntity={relationship.target}
						/>
					</li>
				))}
			</ul>
			}
		</div>
	);
}
EntityRelationships.displayName = 'EntityRelationships';
EntityRelationships.propTypes = {
	contextEntity: PropTypes.object.isRequired,
	relationships: PropTypes.array.isRequired
};

export default EntityRelationships;
