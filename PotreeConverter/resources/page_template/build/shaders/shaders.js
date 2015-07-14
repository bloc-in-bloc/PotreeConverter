Potree.Shaders["pointcloud.vs"] = [
 "",
 "// the following is an incomplete list of attributes, uniforms and defines",
 "// which are automatically added through the THREE.ShaderMaterial",
 "",
 "//attribute vec3 position;",
 "//attribute vec3 color;",
 "//attribute vec3 normal;",
 "",
 "//uniform mat4 modelMatrix;",
 "//uniform mat4 modelViewMatrix;",
 "//uniform mat4 projectionMatrix;",
 "//uniform mat4 viewMatrix;",
 "//uniform mat3 normalMatrix;",
 "//uniform vec3 cameraPosition;",
 "",
 "//#define MAX_DIR_LIGHTS 0",
 "//#define MAX_POINT_LIGHTS 1",
 "//#define MAX_SPOT_LIGHTS 0",
 "//#define MAX_HEMI_LIGHTS 0",
 "//#define MAX_SHADOWS 0",
 "//#define MAX_BONES 58",
 "",
 "#define max_clip_boxes 30",
 "",
 "",
 "attribute float intensity;",
 "attribute float classification;",
 "attribute float returnNumber;",
 "attribute float pointSourceID;",
 "attribute vec4 indices;",
 "",
 "uniform float screenWidth;",
 "uniform float screenHeight;",
 "uniform float fov;",
 "uniform float spacing;",
 "uniform float near;",
 "uniform float far;",
 "uniform float level;",
 "uniform float visibleNodesOffset;",
 "",
 "#if defined use_clip_box",
 "	uniform mat4 clipBoxes[max_clip_boxes];",
 "#endif",
 "",
 "",
 "uniform float heightMin;",
 "uniform float heightMax;",
 "uniform float intensityMin;",
 "uniform float intensityMax;",
 "uniform float size;				// pixel size factor",
 "uniform float minSize;			// minimum pixel size",
 "uniform float maxSize;			// maximum pixel size",
 "uniform float octreeSize;",
 "uniform vec3 bbMin;",
 "uniform vec3 bbSize;",
 "uniform vec3 uColor;",
 "uniform float opacity;",
 "uniform float clipBoxCount;",
 "",
 "",
 "uniform sampler2D visibleNodes;",
 "uniform sampler2D gradient;",
 "uniform sampler2D classificationLUT;",
 "uniform sampler2D depthMap;",
 "",
 "varying float	vOpacity;",
 "varying vec3	vColor;",
 "varying float	vDepth;",
 "varying float	vLinearDepth;",
 "varying vec3	vViewPosition;",
 "varying float 	vRadius;",
 "varying vec3	vWorldPosition;",
 "varying vec3	vNormal;",
 "",
 "",
 "// ---------------------",
 "// OCTREE",
 "// ---------------------",
 "",
 "#if (defined(adaptive_point_size) || defined(color_type_tree_depth)) && defined(tree_type_octree)",
 "/**",
 " * number of 1-bits up to inclusive index position",
 " * number is treated as if it were an integer in the range 0-255",
 " *",
 " */",
 "float numberOfOnes(float number, float index){",
 "	float tmp = mod(number, pow(2.0, index + 1.0));",
 "	float numOnes = 0.0;",
 "	for(float i = 0.0; i < 8.0; i++){",
 "		if(mod(tmp, 2.0) != 0.0){",
 "			numOnes++;",
 "		}",
 "		tmp = floor(tmp / 2.0);",
 "	}",
 "	return numOnes;",
 "}",
 "",
 "",
 "/**",
 " * checks whether the bit at index is 1",
 " * number is treated as if it were an integer in the range 0-255",
 " *",
 " */",
 "bool isBitSet(float number, float index){",
 "	return mod(floor(number / pow(2.0, index)), 2.0) != 0.0;",
 "}",
 "",
 "",
 "/**",
 " * find the tree depth at the point position",
 " */",
 "float getLocalTreeDepth(){",
 "	vec3 offset = bbMin;",
 "	float iOffset = visibleNodesOffset;",
 "	float depth = level;",
 "	for(float i = 0.0; i <= 1000.0; i++){",
 "		",
 "		float nodeSizeAtLevel = octreeSize  / pow(2.0, i + level);",
 "		vec3 index3d = (position - offset) / nodeSizeAtLevel;",
 "		index3d = floor(index3d + 0.5);",
 "		float index = 4.0*index3d.x + 2.0*index3d.y + index3d.z;",
 "		",
 "		vec4 value = texture2D(visibleNodes, vec2(iOffset / 2048.0, 0.0));",
 "		float mask = value.r * 255.0;",
 "		if(isBitSet(mask, index)){",
 "			// there are more visible child nodes at this position",
 "			iOffset = iOffset + value.g * 255.0 + numberOfOnes(mask, index - 1.0);",
 "			depth++;",
 "		}else{",
 "			// no more visible child nodes at this position",
 "			return depth;",
 "		}",
 "		offset = offset + (vec3(1.0, 1.0, 1.0) * nodeSizeAtLevel * 0.5) * index3d;",
 "	}",
 "		",
 "	return depth;",
 "}",
 "",
 "float getPointSizeAttenuation(){",
 "	return pow(1.9, getLocalTreeDepth());",
 "}",
 "",
 "",
 "#endif",
 "",
 "",
 "// ---------------------",
 "// KD-TREE",
 "// ---------------------",
 "",
 "#if (defined(adaptive_point_size) || defined(color_type_tree_depth)) && defined(tree_type_kdtree)",
 "",
 "float getLocalTreeDepth(){",
 "	vec3 offset = vec3(0.0, 0.0, 0.0);",
 "	float iOffset = 0.0;",
 "	float depth = 0.0;",
 "		",
 "		",
 "	vec3 size = bbSize;	",
 "	vec3 pos = position;",
 "		",
 "	for(float i = 0.0; i <= 1000.0; i++){",
 "		",
 "		vec4 value = texture2D(visibleNodes, vec2(iOffset / 2048.0, 0.0));",
 "		",
 "		int children = int(value.r * 255.0);",
 "		float next = value.g * 255.0;",
 "		int split = int(value.b * 255.0);",
 "		",
 "		if(next == 0.0){",
 "		 	return depth;",
 "		}",
 "		",
 "		vec3 splitv = vec3(0.0, 0.0, 0.0);",
 "		if(split == 1){",
 "			splitv.x = 1.0;",
 "		}else if(split == 2){",
 "		 	splitv.y = 1.0;",
 "		}else if(split == 4){",
 "		 	splitv.z = 1.0;",
 "		}",
 "		",
 "		iOffset = iOffset + next;",
 "		",
 "		float factor = length(pos * splitv / size);",
 "		if(factor < 0.5){",
 "		 	// left",
 "		    if(children == 0 || children == 2){",
 "		    	return depth;",
 "		    }",
 "		}else{",
 "		  	// right",
 "		    pos = pos - size * splitv * 0.5;",
 "		    if(children == 0 || children == 1){",
 "		    	return depth;",
 "		    }",
 "		    if(children == 3){",
 "		    	iOffset = iOffset + 1.0;",
 "		    }",
 "		}",
 "		size = size * ((1.0 - (splitv + 1.0) / 2.0) + 0.5);",
 "		",
 "		depth++;",
 "	}",
 "		",
 "		",
 "	return depth;	",
 "}",
 "",
 "float getPointSizeAttenuation(){",
 "	return pow(1.3, getLocalTreeDepth());",
 "}",
 "",
 "#endif",
 "",
 "void main() {",
 "	vec4 worldPosition = modelMatrix * vec4( position, 1.0 );",
 "	vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );",
 "	vViewPosition = -mvPosition.xyz;",
 "	vWorldPosition = worldPosition.xyz;",
 "	gl_Position = projectionMatrix * mvPosition;",
 "	vOpacity = opacity;",
 "	vLinearDepth = -mvPosition.z;",
 "	vDepth = mvPosition.z / gl_Position.w;",
 "	vNormal = normalize(normalMatrix * normal);",
 "",
 "",
 "	// ---------------------",
 "	// POINT COLOR",
 "	// ---------------------",
 "	",
 "	#ifdef color_type_rgb",
 "		vColor = color;",
 "	#elif defined color_type_height",
 "		vec4 world = modelMatrix * vec4( position, 1.0 );",
 "		float w = (world.y - heightMin) / (heightMax-heightMin);",
 "		vColor = texture2D(gradient, vec2(w,1.0-w)).rgb;",
 "	#elif defined color_type_depth",
 "		float d = -mvPosition.z ;",
 "		vColor = vec3(d, vDepth, 0.0);",
 "	#elif defined color_type_intensity",
 "		float w = (intensity - intensityMin) / (intensityMax - intensityMin);",
 "		vColor = vec3(w, w, w);",
 "	#elif defined color_type_intensity_gradient",
 "		float w = (intensity - intensityMin) / intensityMax;",
 "		vColor = texture2D(gradient, vec2(w,1.0-w)).rgb;",
 "	#elif defined color_type_color",
 "		vColor = uColor;",
 "	#elif defined color_type_tree_depth",
 "		float depth = getLocalTreeDepth();",
 "		float w = depth / 10.0;",
 "		vColor = texture2D(gradient, vec2(w,1.0-w)).rgb;",
 "	#elif defined color_type_point_index",
 "		vColor = indices.rgb;",
 "	#elif defined color_type_classification",
 "		float c = mod(classification, 16.0);",
 "		vec2 uv = vec2(c / 255.0, 0.5);",
 "		vColor = texture2D(classificationLUT, uv).rgb;",
 "	#elif defined color_type_return_number",
 "		float w = (returnNumber - 1.0) / 4.0 + 0.1;",
 "		vColor = texture2D(gradient, vec2(w, 1.0 - w)).rgb;",
 "	#elif defined color_type_source",
 "		float w = mod(pointSourceID, 10.0) / 10.0;",
 "		vColor = texture2D(gradient, vec2(w,1.0 - w)).rgb;",
 "	#elif defined color_type_normal",
 "		vColor = (modelMatrix * vec4(normal, 0.0)).xyz;",
 "	#elif defined color_type_phong",
 "		vColor = color;",
 "	#endif",
 "	",
 "	//if(vNormal.z < 0.0){",
 "	//	gl_Position = vec4(1000.0, 1000.0, 1000.0, 1.0);",
 "	//}",
 "	",
 "	// ---------------------",
 "	// POINT SIZE",
 "	// ---------------------",
 "	float pointSize = 1.0;",
 "	",
 "	float projFactor = 1.0 / tan(fov / 2.0);",
 "	projFactor /= vViewPosition.z;",
 "	projFactor *= screenHeight / 2.0;",
 "	float r = spacing * 1.5;",
 "	vRadius = r;",
 "	#if defined fixed_point_size",
 "		pointSize = size;",
 "	#elif defined attenuated_point_size",
 "		pointSize = size * projFactor;",
 "	#elif defined adaptive_point_size",
 "		float worldSpaceSize = size * r / getPointSizeAttenuation();",
 "		pointSize = worldSpaceSize * projFactor;",
 "	#endif",
 "",
 "	pointSize = max(minSize, pointSize);",
 "	pointSize = min(maxSize, pointSize);",
 "	",
 "	vRadius = pointSize / projFactor;",
 "	",
 "	gl_PointSize = pointSize;",
 "	",
 "	",
 "	// ---------------------",
 "	// CLIPPING",
 "	// ---------------------",
 "	",
 "	#if defined use_clip_box",
 "		bool insideAny = false;",
 "		for(int i = 0; i < max_clip_boxes; i++){",
 "			if(i == int(clipBoxCount)){",
 "				break;",
 "			}",
 "		",
 "			vec4 clipPosition = clipBoxes[i] * modelMatrix * vec4( position, 1.0 );",
 "			bool inside = -0.5 <= clipPosition.x && clipPosition.x <= 0.5;",
 "			inside = inside && -0.5 <= clipPosition.y && clipPosition.y <= 0.5;",
 "			inside = inside && -0.5 <= clipPosition.z && clipPosition.z <= 0.5;",
 "			insideAny = insideAny || inside;",
 "		}",
 "		if(!insideAny){",
 "	",
 "			#if defined clip_outside",
 "				gl_Position = vec4(1000.0, 1000.0, 1000.0, 1.0);",
 "			#elif defined clip_highlight_inside && !defined(color_type_depth)",
 "				float c = (vColor.r + vColor.g + vColor.b) / 6.0;",
 "			#endif",
 "		}else{",
 "			#if defined clip_highlight_inside",
 "			vColor.r += 0.5;",
 "			#endif",
 "		}",
 "	",
 "	#endif",
 "	",
 "}",
 "",
].join("\n");

Potree.Shaders["pointcloud.fs"] = [
 "",
 "#if defined use_interpolation",
 "	#extension GL_EXT_frag_depth : enable",
 "#endif",
 "",
 "",
 "// the following is an incomplete list of attributes, uniforms and defines",
 "// which are automatically added through the THREE.ShaderMaterial",
 "",
 "// #define USE_COLOR",
 "// ",
 "// uniform mat4 viewMatrix;",
 "// uniform vec3 cameraPosition;",
 "",
 "",
 "uniform mat4 projectionMatrix;",
 "uniform float opacity;",
 "",
 "",
 "#if defined(color_type_phong)",
 "",
 "	uniform vec3 diffuse;",
 "	uniform vec3 ambient;",
 "	uniform vec3 emissive;",
 "	uniform vec3 specular;",
 "	uniform float shininess;",
 "	uniform vec3 ambientLightColor;",
 "",
 "	#if MAX_POINT_LIGHTS > 0",
 "",
 "		uniform vec3 	pointLightColor[ MAX_POINT_LIGHTS ];",
 "		uniform vec3 	pointLightPosition[ MAX_POINT_LIGHTS ];",
 "		uniform float 	pointLightDistance[ MAX_POINT_LIGHTS ];",
 "",
 "	#endif",
 "",
 "	#if MAX_DIR_LIGHTS > 0",
 "",
 "		uniform vec3 directionalLightColor[ MAX_DIR_LIGHTS ];",
 "		uniform vec3 directionalLightDirection[ MAX_DIR_LIGHTS ];",
 "",
 "	#endif",
 "",
 "#endif",
 "",
 "//#if MAX_SPOT_LIGHTS > 0",
 "//",
 "//	uniform vec3 spotLightColor[ MAX_SPOT_LIGHTS ];",
 "//	uniform vec3 spotLightPosition[ MAX_SPOT_LIGHTS ];",
 "//	uniform vec3 spotLightDirection[ MAX_SPOT_LIGHTS ];",
 "//	uniform float spotLightAngleCos[ MAX_SPOT_LIGHTS ];",
 "//	uniform float spotLightExponent[ MAX_SPOT_LIGHTS ];",
 "//",
 "//	uniform float spotLightDistance[ MAX_SPOT_LIGHTS ];",
 "//",
 "//#endif",
 "",
 "uniform float fov;",
 "uniform float spacing;",
 "uniform float near;",
 "uniform float far;",
 "uniform float pcIndex;",
 "uniform float screenWidth;",
 "uniform float screenHeight;",
 "",
 "uniform sampler2D depthMap;",
 "",
 "varying vec3	vColor;",
 "varying float	vOpacity;",
 "varying float	vLinearDepth;",
 "varying float	vDepth;",
 "varying vec3	vViewPosition;",
 "varying float	vRadius;",
 "varying vec3	vWorldPosition;",
 "varying vec3	vNormal;",
 "",
 "float specularStrength = 1.0;",
 "",
 "void main() {",
 "",
 "	#if defined(circle_point_shape) || defined(use_interpolation) || defined (weighted_splats)",
 "		float u = 2.0 * gl_PointCoord.x - 1.0;",
 "		float v = 2.0 * gl_PointCoord.y - 1.0;",
 "	#endif",
 "	",
 "	#if defined(circle_point_shape) || defined (weighted_splats)",
 "		float cc = u*u + v*v;",
 "		if(cc > 1.0){",
 "			discard;",
 "		}",
 "	#endif",
 "	",
 "	#if defined weighted_splats",
 "		vec2 uv = gl_FragCoord.xy / vec2(screenWidth, screenHeight);",
 "		float depth = texture2D(depthMap, uv).r;",
 "		if(vLinearDepth > depth + vRadius){",
 "			discard;",
 "		}",
 "	#endif",
 "	",
 "	#if defined use_interpolation",
 "		float w = 1.0 - ( u*u + v*v);",
 "		vec4 pos = vec4(-vViewPosition, 1.0);",
 "		pos.z += w * vRadius;",
 "		pos = projectionMatrix * pos;",
 "		pos = pos / pos.w;",
 "		gl_FragDepthEXT = (pos.z + 1.0) / 2.0;",
 "	#endif",
 "	",
 "	#if defined color_type_point_index",
 "		gl_FragColor = vec4(vColor, pcIndex / 255.0);",
 "	#else",
 "		gl_FragColor = vec4(vColor, vOpacity);",
 "	#endif",
 "	",
 "	#if defined weighted_splats",
 "	    float w = pow(1.0 - (u*u + v*v), 2.0);",
 "		gl_FragColor.rgb = gl_FragColor.rgb * w;",
 "		gl_FragColor.a = w;",
 "	#endif",
 "	",
 "	vec3 normal = normalize( vNormal );",
 "	normal.z = abs(normal.z);",
 "	vec3 viewPosition = normalize( vViewPosition );",
 "	",
 "	#if defined(color_type_phong)",
 "",
 "	// code taken from three.js phong light fragment shader",
 "	",
 "		#if MAX_POINT_LIGHTS > 0",
 "",
 "			vec3 pointDiffuse = vec3( 0.0 );",
 "			vec3 pointSpecular = vec3( 0.0 );",
 "",
 "			for ( int i = 0; i < MAX_POINT_LIGHTS; i ++ ) {",
 "",
 "				vec4 lPosition = viewMatrix * vec4( pointLightPosition[ i ], 1.0 );",
 "				vec3 lVector = lPosition.xyz + vViewPosition.xyz;",
 "",
 "				float lDistance = 1.0;",
 "				if ( pointLightDistance[ i ] > 0.0 )",
 "					lDistance = 1.0 - min( ( length( lVector ) / pointLightDistance[ i ] ), 1.0 );",
 "",
 "				lVector = normalize( lVector );",
 "",
 "						// diffuse",
 "",
 "				float dotProduct = dot( normal, lVector );",
 "",
 "				#ifdef WRAP_AROUND",
 "",
 "					float pointDiffuseWeightFull = max( dotProduct, 0.0 );",
 "					float pointDiffuseWeightHalf = max( 0.5 * dotProduct + 0.5, 0.0 );",
 "",
 "					vec3 pointDiffuseWeight = mix( vec3( pointDiffuseWeightFull ), vec3( pointDiffuseWeightHalf ), wrapRGB );",
 "",
 "				#else",
 "",
 "					float pointDiffuseWeight = max( dotProduct, 0.0 );",
 "",
 "				#endif",
 "",
 "				pointDiffuse += diffuse * pointLightColor[ i ] * pointDiffuseWeight * lDistance;",
 "",
 "						// specular",
 "",
 "				vec3 pointHalfVector = normalize( lVector + viewPosition );",
 "				float pointDotNormalHalf = max( dot( normal, pointHalfVector ), 0.0 );",
 "				float pointSpecularWeight = specularStrength * max( pow( pointDotNormalHalf, shininess ), 0.0 );",
 "",
 "				float specularNormalization = ( shininess + 2.0 ) / 8.0;",
 "",
 "				vec3 schlick = specular + vec3( 1.0 - specular ) * pow( max( 1.0 - dot( lVector, pointHalfVector ), 0.0 ), 5.0 );",
 "				pointSpecular += schlick * pointLightColor[ i ] * pointSpecularWeight * pointDiffuseWeight * lDistance * specularNormalization;",
 "				pointSpecular = vec3(0.0, 0.0, 0.0);",
 "			}",
 "		",
 "		#endif",
 "		",
 "		#if MAX_DIR_LIGHTS > 0",
 "",
 "			vec3 dirDiffuse = vec3( 0.0 );",
 "			vec3 dirSpecular = vec3( 0.0 );",
 "",
 "			for( int i = 0; i < MAX_DIR_LIGHTS; i ++ ) {",
 "",
 "				vec4 lDirection = viewMatrix * vec4( directionalLightDirection[ i ], 0.0 );",
 "				vec3 dirVector = normalize( lDirection.xyz );",
 "",
 "						// diffuse",
 "",
 "				float dotProduct = dot( normal, dirVector );",
 "",
 "				#ifdef WRAP_AROUND",
 "",
 "					float dirDiffuseWeightFull = max( dotProduct, 0.0 );",
 "					float dirDiffuseWeightHalf = max( 0.5 * dotProduct + 0.5, 0.0 );",
 "",
 "					vec3 dirDiffuseWeight = mix( vec3( dirDiffuseWeightFull ), vec3( dirDiffuseWeightHalf ), wrapRGB );",
 "",
 "				#else",
 "",
 "					float dirDiffuseWeight = max( dotProduct, 0.0 );",
 "",
 "				#endif",
 "",
 "				dirDiffuse += diffuse * directionalLightColor[ i ] * dirDiffuseWeight;",
 "",
 "				// specular",
 "",
 "				vec3 dirHalfVector = normalize( dirVector + viewPosition );",
 "				float dirDotNormalHalf = max( dot( normal, dirHalfVector ), 0.0 );",
 "				float dirSpecularWeight = specularStrength * max( pow( dirDotNormalHalf, shininess ), 0.0 );",
 "",
 "				float specularNormalization = ( shininess + 2.0 ) / 8.0;",
 "",
 "				vec3 schlick = specular + vec3( 1.0 - specular ) * pow( max( 1.0 - dot( dirVector, dirHalfVector ), 0.0 ), 5.0 );",
 "				dirSpecular += schlick * directionalLightColor[ i ] * dirSpecularWeight * dirDiffuseWeight * specularNormalization;",
 "			}",
 "",
 "		#endif",
 "		",
 "		vec3 totalDiffuse = vec3( 0.0 );",
 "		vec3 totalSpecular = vec3( 0.0 );",
 "		",
 "		#if MAX_POINT_LIGHTS > 0",
 "",
 "			totalDiffuse += pointDiffuse;",
 "			totalSpecular += pointSpecular;",
 "",
 "		#endif",
 "		",
 "		#if MAX_DIR_LIGHTS > 0",
 "",
 "			totalDiffuse += dirDiffuse;",
 "			totalSpecular += dirSpecular;",
 "",
 "		#endif",
 "		",
 "		gl_FragColor.xyz = gl_FragColor.xyz * ( emissive + totalDiffuse + ambientLightColor * ambient ) + totalSpecular;",
 "",
 "	#endif",
 "	",
 "}",
 "",
 "",
 "",
].join("\n");
