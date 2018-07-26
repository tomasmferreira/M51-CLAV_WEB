const client = require('../../config/database').onthology;

var Entidades = module.exports

Entidades.list = function () {
    return client.query(
        `SELECT * {
            ?id rdf:type clav:Entidade ;
                clav:entEstado "Ativa";
                clav:entDesignacao ?Designacao ;
                clav:entSigla ?Sigla ;
                clav:entInternacional ?Internacional.
        }`
    )
        .execute()
        .then(response => Promise.resolve(response.results.bindings))
        .catch(function (error) {
            console.error("Listagem: " + error);
        });
}

Entidades.inTipols = function (id) {
    var fetchQuery = `
        SELECT * WHERE {
            clav:${id} clav:pertenceTipologiaEnt ?id .
            
            ?id clav:tipEstado "Ativa";
                clav:tipSigla ?Sigla;
                clav:tipDesignacao ?Designacao.
        }
    `;

    return client.query(fetchQuery).execute()
        .then(response => Promise.resolve(response.results.bindings))
        .catch(function (error) {
            console.error("Tipologias a que x pertence: " + error);
        });
}


Entidades.stats = function (id) {
    return client.query(`
        SELECT ?Nome ?Sigla ?Estado ?Internacional where {
            clav:${id} clav:entDesignacao ?Nome ;
                clav:entSigla ?Sigla ;
                clav:entEstado ?Estado ;
                clav:entInternacional ?Internacional .
        }`
    )
        .execute()
        //getting the content we want
        .then(response => Promise.resolve(response.results.bindings))
        .catch(function (error) {
            console.error("Dados de uma org: " + error);
        });
}

Entidades.domain = function (id) {
    var fetchQuery = `
        SELECT * WHERE {
            ?id clav:temDono clav:${id} ;
                clav:codigo ?Code ;
                clav:titulo ?Title ;
                clav:pertenceLC clav:lc1 ;
                clav:classeStatus "A" .
        }
    `;

    return client.query(fetchQuery)
        .execute()
        .then(response => Promise.resolve(response.results.bindings))
        .catch(function (error) {
            console.error("Dominio de org: " + error);
        });
}

Entidades.participations = function (id) {
    var fetchQuery = `
        select * where { 
            ?id clav:temParticipante clav:${id} ;
                ?Type clav:${id} ;
            
                clav:titulo ?Title ;
                clav:codigo ?Code ;
                clav:pertenceLC clav:lc1 ;
                clav:classeStatus "A" .
            
            filter (?Type!=clav:temParticipante && ?Type!=clav:temDono)
        }`
        ;

    return client.query(fetchQuery)
        .execute()
        .then(response => Promise.resolve(response.results.bindings))
        .catch(function (error) {
            console.error("Participações de org: " + error);
        });
}

Entidades.checkAvailability = function (name, initials) {
    var checkQuery = `
        SELECT (count(*) as ?Count) where { 
            ?o clav:entSigla ?s ;
                clav:entDesignacao ?n .
            filter (?s='${initials}' || ?n='${name}').
        }
    `;

    return client.query(checkQuery).execute()
        //Getting the content we want
        .then(response => Promise.resolve(response.results.bindings[0].Count.value))
        .catch(function (error) {
            console.error("Error in check:\n" + error);
        });
}

Entidades.checkNameAvailability = function (name) {
    var checkQuery = ` 
        SELECT (count(*) as ?Count) where { 
            ?o clav:entDesignacao '${name}' .
        }
    `;

    return client.query(checkQuery).execute()
        //Getting the content we want
        .then(response => Promise.resolve(response.results.bindings[0].Count.value))
        .catch(function (error) {
            console.error("Error in check:\n" + error);
        });
}

Entidades.createEntidade = function (id, name, initials) {
    var createQuery = `
        INSERT DATA {
            clav:${id} rdf:type owl:NamedIndividual ,
                    clav:Entidade ;
                clav:entDesignacao '${name}' ;
                clav:entSigla '${initials}' ;
                clav:entEstado "Harmonização" ;
                clav:entInternacional '${internacional}' .
        }
    `;

    return client.query(createQuery).execute()
        .then(response => Promise.resolve(response))
        .catch(error => console.error("Error in create:\n" + error));
}

Entidades.updateEntidade = function (dataObj) {

    function prepDelete(dataObj) {
        var ret = "";

        if (dataObj.domain.del && dataObj.domain.del.length) {
            for (let process of dataObj.domain.del) {
                ret += `\tclav:${process.id} clav:temDono clav:${dataObj.id} .\n`;
            }
        }

        for (const pType in dataObj.parts) {
            if (dataObj.parts[pType].del && dataObj.parts[pType].del.length) {
                for (let p of dataObj.parts[pType].del) {
                    ret += "\tclav:" + p.id + " clav:temParticipante" + pType + " clav:" + dataObj.id + " .\n";
                }
            }
        }

        if (dataObj.tipols.del && dataObj.tipols.del.length) {
            for (let tipol of dataObj.tipols.del) {
                ret += `\tclav:${dataObj.id} clav:pertenceTipologiaEnt clav:${tipol.id} .\n`;
            }
        }

        return ret;
    }

    function prepInsert(dataObj) {
        var ret = "";

        if (dataObj.initials) {
            ret += `\tclav:${dataObj.id} clav:entSigla '${dataObj.initials}' .\n`;
        }

        if (dataObj.name) {
            ret += `\tclav:${dataObj.id} clav:entDesignacao '${dataObj.name}' .\n`;
        }

        if (dataObj.domain.add && dataObj.domain.add.length) {
            for (let process of dataObj.domain.add) {
                ret += `\tclav:${process.id} clav:temDono clav:${dataObj.id} .\n`;
            }
        }

        for (const pType in dataObj.parts) {
            if (dataObj.parts[pType].add && dataObj.parts[pType].add.length) {
                for (let p of dataObj.parts[pType].add) {
                    ret += "\tclav:" + p.id + " clav:temParticipante" + pType + " clav:" + dataObj.id + " .\n";
                }
            }
        }

        if (dataObj.tipols.add && dataObj.tipols.add.length) {
            for (let tipol of dataObj.tipols.add) {
                ret += `\tclav:${dataObj.id} clav:pertenceTipologiaEnt clav:${tipol.id} .\n`;
            }
        }

        return ret;
    }

    function prepWhere(dataObj) {
        var ret = "";

        if (dataObj.initials) {
            ret += `\tclav:${dataObj.id} clav:entSigla ?s .\n`;
        }

        if (dataObj.name) {
            ret += `\tclav:${dataObj.id} clav:entDesignacao ?n .\n`;
        }

        return ret;
    }

    var deletePart = "DELETE {\n" + prepWhere(dataObj) + prepDelete(dataObj) + "}\n";
    var inserTPart = "INSERT {\n" + prepInsert(dataObj) + "}\n";
    var wherePart = "WHERE {\n" + prepWhere(dataObj) + "}\n";

    var updateQuery = deletePart + inserTPart + wherePart;

    return client.query(updateQuery).execute()
        .then(response => Promise.resolve(response))
        .catch(error => console.error("Error in update:\n" + error));
}

Entidades.deleteEntidade = function (id) {
    /*var deleteQuery = `
        DELETE {
            clav:${id} ?o ?p .
            ?s ?o clav:${id}
        }
        WHERE { ?s ?o ?p }
    `;*/

    var deleteQuery = `
        DELETE {
            clav:${id} clav:entEstado ?status .
        }
        INSERT {
            clav:${id} clav:entEstado 'Inativa' .
        }
        WHERE {
            clav:${id} clav:entEstado ?status .
        }
    `;

    return client.query(deleteQuery).execute()
        //getting the content we want
        .then(response => Promise.resolve(response))
        .catch(function (error) {
            console.error(error);
        });
}