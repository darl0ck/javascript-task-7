'use strict';


exports.isStar = true;
exports.runParallel = runParallel;

/** Функция паралелльно запускает указанное число промисов
 * @param {Array} jobs – функции, которые возвращают промисы
 * @param {Number} parallelNum - число одновременно исполняющихся промисов
 * @param {Number} timeout - таймаут работы промиса
 */
function runParallel(jobs, parallelNum, timeout = 1000) {
    // асинхронная магия
    let queueOfJobs = jobs
        .map(timer(timeout))
        .map((element, index) => [element, index]);
    let res = [];
    let countFinished = 0;

    function allRes(resolve, jobRes, jobIndex) {
        res[jobIndex] = jobRes;
        ++countFinished;
        if (jobs.length === countFinished) {
            resolve(res);
        } else if (queueOfJobs.length) {
            resolveJobs(resolve, ...queueOfJobs.shift());
        }
    }

    function resolveJobs(resolve, job, i) {
        let handler = jobResult => allRes(resolve, jobResult, i);

        return job()
            .then(handler)
            .catch(handler);
    }

    return new Promise(resolve => {
        let queue;
        if (parallelNum > 0 && jobs.length) {
            queue = queueOfJobs.splice(0, parallelNum);
            queue
                .forEach(([element, index]) => resolveJobs(resolve, element, index));
        } else {
            resolve(res);
        }
    });
}


function _timer(timeout) {
    return jobs => () => new Promise((resolve, reject) =>{
        jobs()
            .then(resolve)
            .catch(reject);
        setTimeout(() => reject(new Error('Promise timeout')), timeout);
    });
}
